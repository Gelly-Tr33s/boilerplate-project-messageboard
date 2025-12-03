"use strict";
const Thread = require("../models/Thread");
const mongoose = require("mongoose");

module.exports = function (app) {

  // THREAD ROUTES
  app.route("/api/threads/:board")

    // GET THREADS
    .get(async (req, res) => {
      const board = req.params.board;

      const threads = await Thread.find({ board })
        .sort({ bumped_on: -1 })
        .limit(10)
        .lean();

      const cleaned = threads.map(t => ({
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

      res.json(cleaned);
    })

    // CREATE THREAD
    .post(async (req, res) => {
      const board = req.params.board;
      const { text, delete_password } = req.body;

      const thread = await Thread.create({
        board,
        text,
        delete_password,
        created_on: new Date(),
        bumped_on: new Date(),
        reported: false,
        replies: []
      });

      res.json(thread);  // IMPORTANT: No redirect
    })

    // REPORT THREAD
    .put(async (req, res) => {
      const { thread_id } = req.body;
      await Thread.findByIdAndUpdate(thread_id, { reported: true });
      res.send("reported");
    })

    // DELETE THREAD
    .delete(async (req, res) => {
      const { thread_id, delete_password } = req.body;
      const thread = await Thread.findById(thread_id);

      if (!thread || thread.delete_password !== delete_password) {
        return res.send("incorrect password");
      }

      await Thread.findByIdAndDelete(thread_id);
      res.send("success");
    });


  // REPLIES ROUTES
  app.route("/api/replies/:board")

    // GET FULL THREAD
    .get(async (req, res) => {
      const thread_id = req.query.thread_id;

      const thread = await Thread.findById(thread_id).lean();
      if (!thread) return res.json({ error: "not found" });

      thread.replies = thread.replies.map(r => ({
        _id: r._id,
        text: r.text,
        created_on: r.created_on
      }));

      res.json(thread);
    })

    // CREATE REPLY
    .post(async (req, res) => {
      const board = req.params.board;
      const { thread_id, text, delete_password } = req.body;

      const reply = {
        _id: new mongoose.Types.ObjectId(),
        text,
        delete_password,
        created_on: new Date(),
        reported: false
      };

      const thread = await Thread.findById(thread_id);
      thread.replies.push(reply);
      thread.bumped_on = new Date();
      await thread.save();

      res.json(reply); // IMPORTANT: No redirect
    })

    // REPORT REPLY
    .put(async (req, res) => {
      const { thread_id, reply_id } = req.body;

      const thread = await Thread.findById(thread_id);
      const reply = thread.replies.id(reply_id);

      reply.reported = true;
      await thread.save();

      res.send("reported");
    })

    // DELETE REPLY
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
