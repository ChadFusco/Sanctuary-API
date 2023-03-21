# Sanctuary-API
API for the Sanctuary Mobile App. Front-end code can be found at [this repo](https://github.com/SanctuarySystems/Sanctuary).

## Table of Contents
- [Description](#description)
- [Key Technologies](#key-technologies)
- [Documentation](#documentation)<details><summary>Endpoints</summary>
  1. [Get User Information](#1-get-user-information)
  2. [Get Spaces Information](#2-get-spaces-information)
  3. [Get Confessions](#3-get-confessions)
  4. [Post Confession](#4-post-confession)
  5. [Post Comment](#5-post-comment)
  6. [Add Space](#6-add-space)
  7. [Report a Confession](#7-report-a-confession)
  8. [Report a Comment](#8-report-a-comment)
  9. [Pop a Comment](#9-pop-a-comment)
  10. [Plop a Comment](#10-plop-a-comment)
  11. [Add User to Space](#11-add-user-to-space)
  12. [Remove User from Space](#12-remove-user-from-space)
  13. [Ban User from Space](#13-ban-user-from-space)
  14. [Delete Confession](#14-delete-confession)
  15. [Delete Comment](#15-delete-comment)
  16. [Add User](#16-add-user)
  17. [Update a Space](#17-update-a-space)
  18. [Add a Hug](#18-add-a-hug)
  19. [Get Confession by ID](#19-get-confession-by-id)
  20. [Mark Comment Read by Space Owner](#20-mark-comment-read-by-space-owner)
  21. [Mark Confession Read by Space Owner](#21-mark-confession-read-by-space-owner)
  22. [Delete Space](#22-delete-space)</details>
- [Team](#team)

## Description
API for Sanctuary - a mobile app featuring user-curated discussion spaces designed to calm the mind and encourage community support. Sanctuary is a highly scalable app originally designed for a mental health counseling practice wishing to expand its online presence and serve its clients online, but is open to the general public and can support a large number of simultaneous users.
## Key Technologies
- [ExpressJS](https://www.npmjs.com/package/express)
- [MongoDB](https://www.mongodb.com/)
- [Mongoose](https://mongoosejs.com/)
- [Node.js](https://nodejs.org)

## Documentation
### **1. Get User Information**

Returns information for a particular user. If `username` does not exist, no data is returned.

**`GET /users/:username`**

**Parameters**
<font size="2">
| Parameter | Type   | Description                    |
| ---       | ---    | ---                            |
| username  | string | username of the user requested |
</font>

**Response**

`Status: 200 OK`
<font size="1">
```json
{
  "username": "lookingforpeace",
  "avatar": "myavatar.jpg",
  "banned": ["space1", "space14"]
  "spaces_joined": ["serenity", "tranquility"],
  "spaces_created": ["respite", "refuge"],
  "reported_read": 11
  "reported": [
    {
      "space_name": "space2",
      "qty": 6
    },
    {
      "space_name": "mountaintop",
      "qty": 7
    }
  ],
  "reports": [
    {
      "space_name": "space60",
      "qty": 1
    }
  ],
}
```
</font>

### **2. Get Spaces Information**

Returns information for all spaces matching the `space_name` parameter. If `space_name` parameter is omitted, returns all spaces as limited by page and count. If `exact` is true, only exact matches of the space (case sensitive) will be returned. If `exact` is false, `space_name` will be a case insensitive search.

**`GET /spaces?space_name=<value>&page=<value>&count=<value>&exact=<value>`**

**Query Parameters**
<font size="2">
| Parameter | Type | Description |
| --- | --- | --- |
| space_name | string | space name of the space(s) requested (optional) |
| page | integer | Select the page of results to return (optional, default = 1) |
| count | integer | Specify how many results per page to return (optional, default = 4) |
| exact | boolean | If true, will return only exact (case sensitive) matches of space_name. If false, will perform case insensitive search using space_name. (optional, default = false) |
</font>

**Response**

`Status: 200 OK`
<font size="1">
```json
[
	{
		"space_name": "tranquility",
		"created_by": "lookingforpeace",
		"createdAt": "2023-01-17T00:46:30.433Z",
		"updatedAt": "2023-01-17T00:46:30.496Z",
		"description": "this is my space",
		"guidelines": ["love your mother", "leave only footprints"],
		"members": ["lookingforpeace", "privateperson", "drake"]
	}
]
```
</font>

### **3. Get Confessions**

Get confessions as optionally filtered by space name, username, space creator, and reported. If `exact` is true, only exact case sensitive matches of the `space` (if provided), `username` (if provided), and `space_creator` (if provided) params will be returned. If `exact` is false, `space_name`, `username`, and `space_creator` will be a case insensitive search.

**`GET /confessions?space_name=<value>&username=<value>&page=<value>&count=<value>&reported=<values>&space_creator=<value>&exact=<value>`**

**Query Parameters**
<font size="2">
| Parameter | Type | Description |
| --- | --- | --- |
| space_name | string | space name to filter the confessions by (optional) |
| username | string | username to filter the confessions by (optional) |
| page | integer | Select the page of results to return (optional, default = 1) |
| count | integer | Specify how many results per page to return (optional, default = 4) |
| reported | boolean | If true, returns reported confessions and confessions having reported comments. Only reported comments returned. If false, returns all unreported confessions with ALL comments removed (this behavior to be improved in the future). Param is optional - confessions and comments returned without any filter on reported status. |
| space_creator | string | Filters confessions by the creator of the space the confession is located in (optional) |
| exact | boolean | If true, will return only exact (case sensitive) matches of space_name, username, and space_creator. If false, will perform case insensitive search using space_name,  username, and space_creator. (optional, default = false) |
</font>

**Response**

`Status: 200 OK`
<font size="1">
```json
[
  {
    "created_by": "lookingforpeace",
    "confession": "my innermost darkest secret revealed here...",
    "reported": [
      "lookingforcalm"
    ],
    "space_name": "tranquility",
    "hugs": 0,
    "comments": [
      {
        "created_by": "lookingforpeace",
        "comment": "the very first comment",
        "reported": [],
        "pops": 0,
        "createdAt": "2023-01-17T07:56:01.487Z",
        "updatedAt": "2023-01-17T07:56:02.561Z",
        "comment_id": 1
      }
    ],
    "createdAt": "2023-01-17T07:56:00.839Z",
    "updatedAt": "2023-01-17T07:56:03.098Z",
    "confession_id": 1,
		"space_creator": "lookingforpeace",
		"conf_creator_avatar": "01",
  },
  {
    "created_by": "lookingforcalm",
    "confession": "sometimes I worry about the future",
    "reported": [],
    "space_name": "tranquility",
    "hugs": 0,
    "comments": [],
    "createdAt": "2023-01-17T16:03:45.166Z",
    "updatedAt": "2023-01-17T16:03:45.166Z",
    "confession_id": 2,
		"space_creator": "lookingforpeace",
		"conf_creator_avatar": "02",
  }
]
```
</font>

### **4. Post Confession**

Post a confession to a space

**`POST /confessions`**

**Body Parameters**
<font size="2">
| Parameter | Type | Description |
| --- | --- | --- |
| created_by | string | Username of user creating the confession (required) |
| confession | string | The confession |
| space_name | string | Name of space where the confession will be posted (required) |
</font>

**Response**

`Status: 201 CREATED`

### **5. Post Comment**

Post a comment on a confession

**`POST /comments`**

**Body Parameters**
<font size="2">
| Parameter | Type | Description |
| --- | --- | --- |
| confession_id | integer | ID of the confession to post the comment for (required) |
| created_by | string | Username of user creating the confession (required) |
| comment | string | The comment |
</font>

**Response**

`Status: 201 CREATED`

### **6. Add Space**

Add a space to the system

**`POST /spaces`**

**Body Parameters**
<font size="2">
| Parameter | Type | Description |
| --- | --- | --- |
| space_name | string | Unique username (required) |
| created_by | string | Username of user who is creating the space (required) |
| description | string | Description of the space |
| guidelines | [string] | Array of guideline strings |
</font>

**Response**

`Status: 201 CREATED`

### **7. Report a Confession**

Report a confession

**`PATCH /confessions/:confession_id/report/:username`**

**Parameters**
<font size="2">
| Parameter | Type | Description |
| --- | --- | --- |
| confession_id | integer | ID of the confession being reported (required) |
| username | string | username of the user reporting the confession (required) |
</font>

**Response**

`Status: 204 NO CONTENT`

### **8. Report a Comment**

Report a comment

**`PATCH /confessions/:confession_id/:comment_id/report/:username`**

**Parameters**
<font size="2">
| Parameter | Type | Description |
| --- | --- | --- |
| confession_id | integer | ID of the confession where the comment is located (required) |
| comment_id | integer | ID of the comment being reported (required) |
| username | string | username of the user reporting the confession (required) |
</font>

**Response**

`Status: 204 NO CONTENT`

### **9. Pop a Comment**

Increase a comment’s pop count by 1. Will not increment if user has already popped the comment.

**`PATCH /confessions/:confession_id/:comment_id/pop/:username`**

**Parameters**
<font size="2">
| Parameter | Type | Description |
| --- | --- | --- |
| confession_id | integer | ID of the confession where the comment is located (required) |
| comment_id | integer | ID of the comment that is to be popped (required) |
| username | string | Username of the user attempting to pop the comment (required) |
</font>

**Response**

`Status: 204 NO CONTENT`

### **10. Plop a Comment**

Decrement a comment’s pop count by 1. Will not decrement if user has already plopped the comment.

**`PATCH /confessions/:confession_id/:comment_id/plop/:username`**

**Parameters**
<font size="2">
| Parameter | Type | Description |
| --- | --- | --- |
| confession_id | integer | ID of the confession where the comment is located (required) |
| comment_id | integer | ID of the comment that is to be plopped (required) |
| username | string | Username of the user attempting to pop the comment (required) |
</font>

**Response**

`Status: 204 NO CONTENT`

### **11. Add User to Space**

Add a user to a particular space

**`PATCH /spaces/:space_name/:username:/add`**

**Parameters**
<font size="2">
| Parameter | Type | Description |
| --- | --- | --- |
| space_name | string | name of the space the user is joining |
| username | string | username of the user joining the space |
</font>

**Response**

`Status: 204 NO CONTENT`

### **12. Remove User from Space**

Remove a user from a particular space

**`PATCH /spaces/:space_name/:username:/remove`**

**Parameters**
<font size="2">
| Parameter | Type | Description |
| --- | --- | --- |
| space_name | string | name of the space the user is joining |
| username | string | username of the user joining the space |
</font>

**Response**

`Status: 204 NO CONTENT`

### **13. Ban User from Space**

Bans a user from a particular space. This endpoint has several notable ***side-effects***:

- Deletes all *confessions* made by the user in the space
- Deletes all *comments* made by the user in the space
- Adds `space_name` to the user’s `banned` array.

**`PATCH /spaces/:space_name/:username/ban`**

**Parameters**
<font size="2">
| Parameter | Type | Description |
| --- | --- | --- |
| space_name | string | name of the space to ban the user from |
| username | string | username of the user to be banned |
</font>

**Response**

`Status: 204 NO CONTENT`

### **14. Delete Confession**

Delete a confession

**`DELETE /confessions/:confession_id`**

**Parameters**
<font size="2">
| Parameter | Type | Description |
| --- | --- | --- |
| confession_id | integer | ID of the confession to delete (required) |
</font>

**Response**

`Status: 204 NO CONTENT`

### **15. Delete Comment**

Delete a comment

**`DELETE /confessions/:confession_id/:comment_id`**

**Parameters**
<font size="2">
| Parameter | Type | Description |
| --- | --- | --- |
| confession_id | integer | ID of the confession where the comment to be deleted is located (required) |
| comment_id | integer | ID of the comment being deleted (required) |
</font>

**Response**

`Status: 204 NO CONTENT`

### **16. Add User**

Add a user to the system

**`POST /users`**

**Body Parameters**
<font size="2">
| Parameter | Type | Description |
| --- | --- | --- |
| username | string | Unique username (required) |
| avatar | string | Filename or path or other string identifier for avatar image (required) |
</font>

**Response**

`Status: 201 CREATED`

### **17. Update a Space**

Update the description and/or the guidelines for a particular space.

**`PATCH /spaces/:space_name`**

**Parameters**
<font size="2">
| Parameter | Type | Description |
| --- | --- | --- |
| space_name | string | name of the space the user is joining |
</font>

**Body Parameters**
<font size="2">
| Parameter | Type | Description |
| --- | --- | --- |
| description | string | New description for the space (optional) |
| guidelines | Array of strings | New guidelines for the space (optional). Note that if this parameter is specified, the original guidelines will be deleted. |
</font>

**Response**

`Status: 204 NO CONTENT`

### **18. Add a Hug**

Add a hug to a particular confession

**`PATCH /confessions/:confession_id/hug`**

**Parameters**
<font size="2">
| Parameter | Type | Description |
| --- | --- | --- |
| confession_id | integer | ID of the confession to add a hug for (required) |
</font>

**Response**

`Status: 204 NO CONTENT`

### **19. Get Confession By ID**

Get a single confession by the confession ID.

**`GET /confessions/:confession_id`**

**Parameters**
<font size="2">
| Parameter | Type | Description |
| --- | --- | --- |
| confession_id | integer | ID of the requested confession (required) |
</font>

**Response**

`Status: 200 OK`
<font size="1">
```json
{
  "created_by": "lookingforpeace",
  "confession": "my innermost darkest secret revealed here...",
  "reported": [
    "lookingforcalm"
  ],
  "space_name": "tranquility",
  "hugs": 0,
  "comments": [
    {
      "created_by": "lookingforpeace",
      "comment": "the very first comment",
      "reported": [],
      "pops": 0,
      "createdAt": "2023-01-17T07:56:01.487Z",
      "updatedAt": "2023-01-17T07:56:02.561Z",
      "comment_id": 1
    }
  ],
  "createdAt": "2023-01-17T07:56:00.839Z",
  "updatedAt": "2023-01-17T07:56:03.098Z",
  "confession_id": 1,
}
```
</font>

### **20. Mark Comment Read by Space Owner**

Mark a reported comment as read by the owner of the space the comment belongs to.
***Side-effect***: The `reported_read` property on the space owner user is incremented by 1.

**`PATCH /confessions/:confession_id/:comment_id/reported_read`**

**Parameters**
<font size="2">
| Parameter | Type | Description |
| --- | --- | --- |
| confession_id | integer | ID of the confession where the comment is located (required) |
| comment_id | integer | ID of the comment being marked as read by space owner (required) |
</font>

**Response**

`Status: 204 NO CONTENT`

### **21. Mark Confession Read by Space Owner**

Mark a reported confession as read by the owner of the space the confession belongs to.
***Side-effect***: The `reported_read` property on the space owner user is incremented by 1.

**`PATCH /confessions/:confession_id/reported_read`**

**Parameters**
<font size="2">
| Parameter | Type | Description |
| --- | --- | --- |
| confession_id | integer | ID of the confession being marked as read by space owner (required) |
</font>

**Response**

`Status: 204 NO CONTENT`

### **22. Delete Space**

Delete a space

**`DELETE /spaces/:space_name`**

**Parameters**
<font size="2">
| Parameter | Type | Description |
| --- | --- | --- |
| space_name | string | Space name of space to delete (required) |
</font>

**Response**

`Status: 204 NO CONTENT`

## Team
* **Max Peterson - Product Manager**
	* https://github.com/maxpeterson96
	* https://www.linkedin.com/in/max-peterson-10b368b3/
* **Chad Fusco - Software Architect**
  * https://www.linkedin.com/in/chadfusco
  * https://github.com/ChadFusco
* **Joseph Soto - UI Designer**
* **Kimberly Cheung**
  * https://www.linkedin.com/in/kimberlywycheung
  * https://github.com/kimberlywycheung
* **Warren Siu**
  * https://www.linkedin.com/in/warrensiu
  * https://github.com/warrensiu
* **Sai Vemireddy**
  * https://github.com/svemi
  * https://www.linkedin.com/in/sai-vemireddy/
* **Justin Chong**


<!-- ![Demo of Overview Section](/client/src/assets/README-RelatedOutfit.gif) -->