import express from 'express';

const app = express();
const port = 3000;

app.get('/healthcheck', (req, res) => {
  res.sendStatus(200);
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
