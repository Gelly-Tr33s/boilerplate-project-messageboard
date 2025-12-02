'use strict';
const Thread = require('../models/Thread');


module.exports = function (app) {
  
  // threads
  app.route('/api/threads/:board')
    .get(async (req, res) => {
      const board = req.params.board;

      const threads = await Thread.find({ board })
        .sort({ bumped_on: -1 })
        .limit(10)
        .lean();

      const clean = threads.map(t => ({
        _id: t._id,
        text: t.text,
        created_on: t.created_on,
        bumped_on: t.bumped_on,
        replies: t.replies.slice(-3).map(r => ({
          _id: r._id,
          text: r.text,
          created_on: r.created_on
        }))
      }));

      res.json(clean);
    })

    .post(async (req, res) => {
      const board = req.params.board;
      const { text, delete_password } = req.body;

      const thread = new Thread({
        board,
        text,
        delete_password,
        created_on: new Date(),
        bumped_on: new Date(),
        reported: false,
        replies: []
      });

      await thread.save();
      res.json(thread);
    })

    .put(async (req, res) => {
      const { thread_id } = req.body;

      await Thread.findByIdAndUpdate(thread_id, { reported: true });
      res.send("reported");
    })

    .delete(async (req, res) => {
      const { thread_id, delete_password } = req.body;
      const thread = await Thread.findById(thread_id);

      if (!thread || thread.delete_password !== delete_password) {
        return res.send("incorrect password");
      }

      await Thread.findByIdAndDelete(thread_id);
      res.send("success");
    });  
  
  // replies
  app.route('/api/replies/:board')
    .get(async (req, res) => {
      const thread_id = req.query.thread_id;

      const thread = await Thread.findById(thread_id).lean();

      if (!thread) return res.json({ error: "not found" });

      // Remove sensitive fields
      const cleanReplies = thread.replies.map(r => ({
        _id: r._id,
        text: r.text,
        created_on: r.created_on
      }));

      res.json({
        _id: thread._id,
        text: thread.text,
        created_on: thread.created_on,
        bumped_on: thread.bumped_on,
        replies: cleanReplies
      });
    })

    .post(async (req, res) => {
      const board = req.params.board;
      const { text, delete_password, thread_id } = req.body;

      const reply = {
        text,
        delete_password,
        created_on: new Date(),
        reported: false
      };

      const thread = await Thread.findById(thread_id);
      thread.replies.push(reply);
      thread.bumped_on = new Date();
      await thread.save();

      res.json(thread);
    })

    .put(async (req, res) => {
      const { thread_id, reply_id } = req.body;

      const thread = await Thread.findById(thread_id);
      const reply = thread.replies.id(reply_id);

      reply.reported = true;
      await thread.save();

      res.send("reported");
    })

    .delete(async (req, res) => {
      const { thread_id, reply_id, delete_password } = req.body;

      const thread = await Thread.findById(thread_id);
      const reply = thread.replies.id(reply_id);

      if (!reply || reply.delete_password !== delete_password) {
        return res.send("incorrect password");
      }

      reply.text = "[deleted]";
      await thread.save();

      res.send("success");
    });




};
