const { assert } = require('chai');
const { mocha } = require('mocha');
const { getUserByEmail } = require('../helpersTest.js');
mocha();

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers);
    const expectedUserID = "userRandomID";
    assert.strictEqual(user.id, expectedUserID);
  });

  it('should return undefined for an email that is not in the database', function() {
    const user = getUserByEmail("nonexistent@example.com", testUsers);
    assert.isUndefined(user);
  });

  it('should return a user object with an email that matches the input email', function() {
    const inputEmail = "user@example.com";
    const user = getUserByEmail(inputEmail, testUsers);
    assert.strictEqual(user.email, inputEmail);
  });
});