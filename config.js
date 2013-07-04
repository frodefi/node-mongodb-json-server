'use strict';

module.exports = {
  env:            process.env.NODE_ENV     || "development",
  db: {
    production:   process.env.MONGOLAB_URI,
    development:  process.env.MONGO_URI    || 'mongodb://dbuser:dbpassword@dbhost.com:27017/dbname',
    test:         process.env.MONGO_URI    || 'mongodb://localhost:27017/dbname'
  },
  mailer: {
    transport:    process.env.SMTP_SERVICE || "SMTP",
    login: {
      service:    process.env.SMTP_SERVICE || "Gmail",
      auth: {
        user:     process.env.SMTP_USER    || 'test@example.com',
        pass:     process.env.SMTP_PASS    || 'secret'
      }
    },
    from:         process.env.SMTP_FROM    || '"First Last" <test@examle.com>'
  }
}