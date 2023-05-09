const admin = require('firebase-admin');
const serviceAccount = require('../keys/care-chat-386021-1a8b55a04e7f.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const testUserUid = process.argv[2];

if (!testUserUid) {
  console.error('Usage: node create_custom_token.js <test_user_uid>');
  process.exit(1);
}

admin
  .auth()
  .createCustomToken(testUserUid)
  .then((customToken) => {
    console.log(customToken);
  })
  .catch((error) => {
    console.error('Error creating custom token:', error);
  });
