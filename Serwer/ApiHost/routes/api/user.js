"use-strict"

var express = require('express');
var router  = express.Router();

var assert = require('assert');
var validator = require('validator');

var helpers = require('../../helpers.js');
var authorize = require('../../authorize.js');
var database = require('../../database.js');

router.use(authorize.verifyToken);

/**
 * @swagger
 * /api/user:
 *   post:
 *     security:
 *       - userAuthorization: []
 *     tags:
 *       - User
 *     description: Adds a new user
 *     consumes:
 *       - application/x-www-form-urlencoded
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: username
 *         description: username of a new user
 *         in: formData
 *         required: true
 *         type: string
 *
 *       - name: email
 *         description: valid email of a new user
 *         in: formData
 *         required: true
 *         type: string
 *         format: email
 *
 *       - name: password
 *         description: password of a new user
 *         in: formData
 *         required: true
 *         type: string
 *         format: password
 *     responses:
 *       200:
 *         description: user added succesfully
 *         schema:
 *           $ref: '#/definitions/ApiResponse'
 *       500:
 *         description: general server error
 *         schema:
 *           $ref: '#/definitions/ApiResponse'
 *
 *
 */

router.post('/', function(req, res, next){
  assert.notEqual(req.decoded.permissions, 'regularUser', "Access denied!");
  validateUserRequestData(req);

  var newUserData = new database.UserData(req.body.username, req.body.email, req.body.password);
  database.addUser(newUserData, next);
}, function(req, res){
  res.json({"success": true, "message": "user added Successfully"});
});

/**
 * @swagger
 * /api/user:
 *   put:
 *     security:
 *       - userAuthorization: []
 *     tags:
 *       - User
 *     description: Modifies existing user. In order to change data at least one parameter is required. To modify only password send password param, to modify all, send all of them.
 *     consumes:
 *       - application/x-www-form-urlencoded
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: username
 *         description: new username for the current user
 *         in: formData
 *         required: false
 *         type: string
 *
 *       - name: email
 *         description: new name for a current user
 *         in: formData
 *         required: false
 *         type: string
 *         format: email
 *
 *       - name: password
 *         description: new password for current user
 *         in: formData
 *         required: false
 *         type: string
 *         format: password
 *     responses:
 *       200:
 *         description: user updated succesfully
 *         schema:
 *           $ref: '#/definitions/ApiResponse'
 *       500:
 *         description: general server error
 *         schema:
 *           $ref: '#/definitions/ApiResponse'
 *
 *
 */
router.put('/', function(req, res, next){
  assert.Equal(req.decoded.permissions, 'regularUser', "You are not logged into the user account");
  database.findUserById(req.decoded.userId, res, next);
},
  function(req, res, next){
    var oldUserData = res.locals.userData;
    console.log("Old user data");
    console.log(oldUserData);
    var modifiedUserData = new database.UserData(oldUserData.username, oldUserData.email);
    modifiedUserData.passwordEncrypted = oldUserData.password;

    if(req.body.hasOwnProperty('username')){
      assert.ok(validator.isLength(req.body.username, {"min": 6, "max": 40}), "Username should be between 6 and 40 characters");
      modifiedUserData.username = req.body.username;
    }
    if(req.body.hasOwnProperty('email')){
      assert.ok(validator.isEmail(req.body.email), "Ivalid email provided");
      modifiedUserData.email = req.body.email;
    }
    if(req.body.hasOwnProperty('password')){
      assert.ok(validator.isLength(req.body.password, {"min":6, "max":100}), "Password should be between 6 and 100 characters");
      modifiedUserData.password = req.body.password;
      modifiedUserData.encryptPassword();
    }

    database.updateUser(modifiedUserData, oldUserData.id, next);
},
 function(req, res){
   res.json({"sucess": true, "message": "Data updated successfully"});
});


/**
 * validetes username, email, password in request containting userData
 * @param  {req} req request express object
 */
function validateUserRequestData(req){
  assert.ok(req.body.hasOwnProperty('username'), "username field required");
  assert.ok(req.body.hasOwnProperty('email'), "email field required");
  assert.ok(req.body.hasOwnProperty('password'), "password field required");
  assert.ok(validator.isLength(req.body.password, {"min":6, "max":100}), "Password should be between 6 and 100 characters");
  assert.ok(validator.isEmail(req.body.email), "Ivalid email provided");
  assert.ok(validator.isLength(req.body.username, {"min": 6, "max": 40}), "Username should be between 6 and 40 characters");
}


module.exports = router;
