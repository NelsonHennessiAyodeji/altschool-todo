const chai = require("chai");
const chaiHttp = require("chai-http");
const app = require("../app");
const User = require("../models/User");

chai.use(chaiHttp);
const expect = chai.expect;

describe("Authentication", () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe("POST /register", () => {
    it("should register a new user", (done) => {
      chai
        .request(app)
        .post("/register")
        .send({
          username: "testuser",
          email: "test@example.com",
          password: "password123",
          confirmPassword: "password123",
        })
        .end((err, res) => {
          expect(res).to.redirect;
          expect(res).to.have.status(200);
          done();
        });
    });

    it("should not register user with existing email", (done) => {
      // First registration
      chai
        .request(app)
        .post("/register")
        .send({
          username: "testuser1",
          email: "test@example.com",
          password: "password123",
          confirmPassword: "password123",
        })
        .end(() => {
          // Second registration with same email
          chai
            .request(app)
            .post("/register")
            .send({
              username: "testuser2",
              email: "test@example.com",
              password: "password123",
              confirmPassword: "password123",
            })
            .end((err, res) => {
              expect(res).to.redirect;
              done();
            });
        });
    });
  });

  describe("POST /login", () => {
    beforeEach(async () => {
      await chai.request(app).post("/register").send({
        username: "testuser",
        email: "test@example.com",
        password: "password123",
        confirmPassword: "password123",
      });
    });

    it("should login with valid credentials", (done) => {
      chai
        .request(app)
        .post("/login")
        .send({
          email: "test@example.com",
          password: "password123",
        })
        .end((err, res) => {
          expect(res).to.redirect;
          expect(res).to.have.status(200);
          done();
        });
    });

    it("should not login with invalid credentials", (done) => {
      chai
        .request(app)
        .post("/login")
        .send({
          email: "test@example.com",
          password: "wrongpassword",
        })
        .end((err, res) => {
          expect(res).to.redirect;
          done();
        });
    });
  });
});
