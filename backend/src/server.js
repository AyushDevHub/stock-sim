import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('This is my stock sim backend server! And it is running smoothly.');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});