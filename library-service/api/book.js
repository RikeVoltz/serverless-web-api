'use strict';

const uuid = require('uuid');
const AWS = require('aws-sdk');

AWS.config.setPromisesDependency(require('bluebird'));

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.submit = (event, context, callback) => {
    const requestBody = JSON.parse(event.body);
    const title = requestBody.title;
    const ISBN = requestBody.ISBN;
    const publish_date = requestBody.publish_date;

    if (typeof title !== 'string' || typeof ISBN !== 'string' || typeof publish_date !== 'number') {
        console.error('Validation Failed');
        callback(new Error('Couldn\'t submit book because of validation errors.'));
        return;
    }

    submitBookP(bookInfo(title, ISBN, publish_date))
        .then(res => {
            callback(null, {
                statusCode: 200,
                body: JSON.stringify({
                    message: `Sucessfully submitted book with ISBN ${ISBN}`,
                    bookId: res.id
                })
            });
        })
        .catch(err => {
            console.log(err);
            callback(null, {
                statusCode: 500,
                body: JSON.stringify({
                    message: `Unable to submit book with ISBN ${ISBN}`
                })
            })
        });
};


const submitBookP = book => {
    console.log('Submitting book');
    const bookInfo = {
        TableName: process.env.BOOK_TABLE,
        Item: book,
    };
    return dynamoDb.put(bookInfo).promise()
        .then(res => book);
};

const bookInfo = (title, ISBN, publish_date) => {
    const timestamp = new Date().getTime();
    return {
        id: uuid.v1(),
        title: title,
        ISBN: ISBN,
        publish_date: publish_date,
        submittedAt: timestamp,
        updatedAt: timestamp,
    };
};

module.exports.list = (event, context, callback) => {
    var params = {
        TableName: process.env.BOOK_TABLE,
        ProjectionExpression: "id, title, ISBN, publish_date"
    };

    console.log("Scanning Book table.");
    const onScan = (err, data) => {

        if (err) {
            console.log('Scan failed to load data. Error JSON:', JSON.stringify(err, null, 2));
            callback(err);
        } else {
            console.log("Scan succeeded.");
            return callback(null, {
                statusCode: 200,
                body: JSON.stringify({
                    books: data.Items
                })
            });
        }

    };

    dynamoDb.scan(params, onScan);

};

module.exports.get = (event, context, callback) => {
    let params = {TableName: process.env.BOOK_TABLE};
    if (event.pathParameters.id !== undefined) {
        params.Key = {id: event.pathParameters.id};
        dynamoDb.get(params).promise()
            .then(result => {
                const response = {
                    statusCode: 200,
                    body: JSON.stringify(result.Item),
                };
                callback(null, response);
            })
            .catch(error => {
                console.error(error);
                callback(new Error('Invalid id'));
                return;
            });
    } else if (event.pathParameters.ISBN !== undefined) {
        params.FilterExpression = "#ISBN = :ISBN";
        params.ExpressionAttributeNames = {
            "#ISBN": "ISBN",
        };
        params.ExpressionAttributeValues = {
            ":ISBN": event.pathParameters.ISBN
        };
        dynamoDb.scan(params).promise()
            .then(result => {
                const response = {
                    statusCode: 200,
                    body: JSON.stringify(result.Items),
                };
                callback(null, response);
            })
            .catch(error => {
                console.error(error);
                callback(new Error('Invalid ISBN'));
                return;
            });
    } else {
        const msg = 'Bad search argument.';
        console.error(msg);
        callback(new Error(msg));
        return;
    }
};

module.exports.delete = (event, context, callback) => {
    const params = {
        TableName: process.env.BOOK_TABLE,
        Key: {id: event.pathParameters.id}
    };

    dynamoDb.delete(params).promise()
        .then(result => {
            const response = {
                statusCode: 200,
                body: JSON.stringify("Book deleted successfully"),
            };
            callback(null, response);
        })
        .catch(error => {
            console.error(error);
            callback(new Error('Unable to delete book'));
            return;
        });

};

module.exports.update = (event, context, callback) => {
    let update_expression = "set ";
    let expression_attribute_values = {};
    if (event.pathParameters.title !== undefined) {
        update_expression += "title=:title";
        expression_attribute_values[':title'] = event.pathParameters.title;
    }
    if (event.pathParameters.ISBN !== undefined) {
        update_expression += "ISBN=:ISBN";
        expression_attribute_values[':ISBN'] = event.pathParameters.ISBN;
    }
    if (event.pathParameters.publish_date !== undefined) {
        update_expression += "publish_date=:publish_date";
        expression_attribute_values[':publish_date'] = event.pathParameters.publish_date;
    }
    const params = {
        TableName: process.env.BOOK_TABLE,
        Key: {id: event.pathParameters.id},
        UpdateExpression: update_expression,
        ExpressionAttributeValues: expression_attribute_values
    };

    dynamoDb.update(params).promise()
        .then(result => {
            const response = {
                statusCode: 200,
                body: JSON.stringify("Book updated successfully"),
            };
            callback(null, response);
        })
        .catch(error => {
            console.error(error);
            callback(new Error('Unable to update book'));
            return;
        });

};