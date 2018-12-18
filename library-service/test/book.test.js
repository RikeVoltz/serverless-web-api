'use strict';
//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let should = chai.should();


chai.use(chaiHttp);
//Our parent block
describe('Books', () => {
    /*
      * Test the /GET route
      */
    var host = 'https://ztfq39f6y7.execute-api.us-east-2.amazonaws.com';
    var path = '/dev/books';
    describe('/GET books', () => {
        it('it should GET all the books', (done) => {
            chai.request(host)
                .get(path)
                .end((err, res) => {
                    res.should.have.status(404);
                    res.body.message.should.be.a('String');
                    res.body.message.should.be.eql('Books not found');
                    done();
                });
        });
    });

    let new_id = 0;
    let ISBN = '123-123-123-123';
    describe('/POST books/{id}', () => {
        it('it should POST new book', (done) => {
            chai.request(host)
                .post(path)
                .set('content-type', 'application/json')
                .send({title: 'test', publish_date:1928, ISBN:ISBN})
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.message.should.be.a('String');
                    res.body.message.should.be.eql('Ok');
                    new_id = res.body.bookId;
                    done();
                });
        });
    });

    describe('/GET books/{id}', () => {
        it('it should GET one book', (done) => {
            chai.request(host)
                .get(path+'/' +new_id)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('Object');
                    res.body.id.should.be.eql(new_id);
                    done();
                });
        });
    });



    describe('/GET books/ISBN/{ISBN}', () => {
        it('it should GET book by ISBN', (done) => {
            chai.request(host)
                .get(path + '/ISBN/'+ISBN)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('Array');
                    res.body[0].ISBN.should.be.eql(ISBN);
                    done();
                });
        });
    });

    describe('/PUT books/{id}', () => {
        it('it should PUT one book (=change)', (done) => {
            chai.request(host)
                .put(path + '/'+ new_id)
                .set('content-type', 'application/json')
                .send({title: 'not-test', publish_date:2028, ISBN:ISBN+'1'})
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('String');
                    res.body.should.be.eql('Ok');
                    done();
                });
        });
    });


    describe('/DELETE books/{id}', () => {
        it('it should DELETE one book', (done) => {
            chai.request(host)
                .delete(path + '/'+ new_id)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('String');
                    res.body.should.be.eql('Ok');
                    done();
                });
        });
    });

});