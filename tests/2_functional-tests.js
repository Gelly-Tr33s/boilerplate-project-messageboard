const chai = require('chai');
const assert = chai.assert;

const chaiHttp = require('chai-http').default || require('chai-http');
chai.use(chaiHttp);

// fallback: attach request manually if plugin failed
if (typeof chai.request !== 'function') {
  chai.request = require('chai-http').request;
}

const server = require('../server');

console.log("chai-http export:", require("chai-http"));
console.log("Loaded tests file successfully");



suite('Functional Tests', function() {
  let testThreadId;
  let testReplyId;

  test('POST /api/threads/test', function(done) {
    chai.request(server)
      .post('/api/threads/test')
      .send({ text: 'Test Thread', delete_password: 'pass' })
      .end((err, res) => {
        assert.equal(res.status, 200);
        testThreadId = res.body._id;
        done();
      });
  });

  test('GET /api/threads/test', function(done) {
    chai.request(server)
      .get('/api/threads/test')
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.isArray(res.body);
        done();
      });
  });

  test('PUT /api/threads/test', function(done) {
    chai.request(server)
      .put('/api/threads/test')
      .send({ thread_id: testThreadId })
      .end((err, res) => {
        assert.equal(res.text, 'reported');
        done();
      });
  });

  test('POST /api/replies/test', function(done) {
    chai.request(server)
      .post('/api/replies/test')
      .send({
        thread_id: testThreadId,
        text: "Test reply",
        delete_password: "pass"
      })
      .end((err, res) => {
        assert.equal(res.status, 200);
        testReplyId =
          res.body.replies[res.body.replies.length - 1]._id;
        done();
      });
  });

  test('GET /api/replies/test', function(done) {
    chai.request(server)
      .get('/api/replies/test')
      .query({ thread_id: testThreadId })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.property(res.body, "replies");
        done();
      });
  });

  test('PUT /api/replies/test', function(done) {
    chai.request(server)
      .put('/api/replies/test')
      .send({
        thread_id: testThreadId,
        reply_id: testReplyId
      })
      .end((err, res) => {
        assert.equal(res.text, 'reported');
        done();
      });
  });

  test('DELETE wrong password /api/threads/test', function(done) {
    chai.request(server)
      .delete('/api/threads/test')
      .send({ thread_id: testThreadId, delete_password: 'wrong' })
      .end((err, res) => {
        assert.equal(res.text, "incorrect password");
        done();
      });
  });

  test('DELETE wrong password /api/replies/test', function(done) {
    chai.request(server)
      .delete('/api/replies/test')
      .send({
        thread_id: testThreadId,
        reply_id: testReplyId,
        delete_password: 'wrong'
      })
      .end((err, res) => {
        assert.equal(res.text, 'incorrect password');
        done();
      });
  });

  test('DELETE correct password /api/replies/test', function(done) {
    chai.request(server)
      .delete('/api/replies/test')
      .send({
        thread_id: testThreadId,
        reply_id: testReplyId,
        delete_password: 'pass'
      })
      .end((err, res) => {
        assert.equal(res.text, 'success');
        done();
      });
  });

  test('DELETE correct password /api/threads/test', function(done) {
    chai.request(server)
      .delete('/api/threads/test')
      .send({
        thread_id: testThreadId,
        delete_password: 'pass'
      })
      .end((err, res) => {
        assert.equal(res.text, 'success');
        done();
      });
  });


});
