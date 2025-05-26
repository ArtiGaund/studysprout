Project condition: 
1) while signup 
Error in registering the user  MongoServerError: E11000 duplicate key error collection: studySproutUser.users index: workspace.folders._id_1 dup key: { workspace.folders._id: null }
    at InsertOneOperation.execute (E:\Projects\studysprout\node_modules\mongodb\lib\operations\insert.js:51:19)
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
    at async executeOperation (E:\Projects\studysprout\node_modules\mongodb\lib\operations\execute_operation.js:136:16)
    at async Collection.insertOne (E:\Projects\studysprout\node_modules\mongodb\lib\collection.js:155:16) {
  errorResponse: {
    index: 0,
    code: 11000,
    errmsg: 'E11000 duplicate key error collection: studySproutUser.users index: workspace.folders._id_1 dup key: { workspace.folders._id: null }',
    keyPattern: { 'workspace.folders._id': 1 },
    keyValue: { 'workspace.folders._id': null }
  },
  Resolved by deleting the workspace.folders._id field in atlas

  2) Its still creating the account, even if the user is not getting the verify code