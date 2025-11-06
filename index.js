
const express = require('express');
const bodyParser = require('body-parser');
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');

const app = express();
const port = 3000;

let stage = 0;
const users = [
  {
    id: 1,
    name: 'Test User 1',
    email: 'test1@example.com',
    password: 'password123',
    inviteCode: 'SAVE_THE_WORLD'
  },
  {
    id: 2,
    name: 'Test User 2',
    email: 'test2@example.com',
    password: 'password456',
    inviteCode: 'DESTROY_THE_WORLD'
  }
];

app.use(bodyParser.json());
app.use(express.static('public'));

app.get('/swagger.json', (req, res) => {
  const swaggerTemplate = JSON.parse(fs.readFileSync('swagger-template.json', 'utf8'));
  if (stage === 1) {
    swaggerTemplate.paths['/register'].post.parameters[0].schema.properties.inviteCode = {
      type: 'string',
      description: 'Required for stage 1 (403 Forbidden)'
    };
  }
  res.json(swaggerTemplate);
});

app.use('/api-docs', swaggerUi.serve, (req, res, next) => {
  const swaggerUrl = `${req.protocol}://${req.get('host')}/swagger.json`;
  swaggerUi.setup(null, { swaggerUrl })(req, res, next);
});

app.post('/register', (req, res) => {
  if (stage === 1 && req.body.inviteCode !== 'SAVE_THE_WORLD') {
    return res.status(403).send('Forbidden');
  }
  if (stage === 2) {
    return res.status(500).send('Internal Server Error');
  }
  if (stage === 4) {
    try {
      const { name, email, password } = req.body;
      if (!name || !email || !password) {
        throw new Error('Malformed request');
      }
    } catch (error) {
      return res.status(500).send('Internal Server Error');
    }
  }

  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).send('Missing required fields');
  }
  const user = { id: users.length + 1, name, email, password };
  if (stage === 1) {
    user.inviteCode = 'SAVE_THE_WORLD';
  }
  users.push(user);
  if (stage !== 1) {
    const { inviteCode, ...userWithoutInviteCode } = user;
    return res.status(201).json(userWithoutInviteCode);
  }
  res.status(201).json(user);
});

app.put('/register', (req, res) => {
  if (stage === 5) {
    return res.status(500).send('Internal Server Error');
  }
  res.status(405).send('Method Not Allowed');
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  if (user) {
    res.json({ message: 'Login successful', token: 'fake-token' });
  } else {
    res.status(401).send('Invalid credentials');
  }
});

app.get('/users/:id', (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));
  if (user) {
    if (stage === 1) {
      res.json(user);
    } else {
      const { inviteCode, ...userWithoutInviteCode } = user;
      res.json(userWithoutInviteCode);
    }
  } else {
    res.status(404).send('User not found');
  }
});

app.get('/users', (req, res) => {
  if (stage === 1) {
    res.json(users);
  } else {
    const usersWithoutInviteCode = users.map(user => {
      const { inviteCode, ...userWithoutInviteCode } = user;
      return userWithoutInviteCode;
    });
    res.json(usersWithoutInviteCode);
  }
});

app.post('/next-case', (req, res) => {
  if (stage < 5) {
    stage++;
  } else {
    stage = 0;
  }
  res.send(`Stage changed to ${stage}`);
});

app.get('/stage', (req, res) => {
  res.json({ stage });
});

app.get('/bugs', (req, res) => {
  res.json(bugs);
});

app.use((req, res, next) => {
  if (stage === 3 && req.path === '/register-bad') {
    return res.status(500).send('Internal Server Error');
  }
  res.status(404).send("Sorry can't find that!")
})

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

const bugs = [
  "Баг фронтенда: форма регистрации не отправляет запрос на сервер при попытке зарегистрироваться. " +
  "Это можно проверить, открыв вкладку «Netwokr» в инструментах разработчика браузера.",
  "Баг фронтенда: в форме регистрации отсутствует обязательное поле для ввода инвайт-кода, " +
  "который в данном случае необходим для регистрации. " +
  "Бэкенд правильно возвращает ошибку 403 Forbidden, поскольку инвайт-код отсутствует. " +
  "Данный код можно найти в запросах на получение информации о пользователях.",
  "Баг бэкенда: сервер возвращает ошибку 500 Internal Server Error. " +
  "Это общее сообщение об ошибке, которое указывает на то, что на сервере возникло непредвиденное условие.",
  "Баг фронтенда: фронтенд отправляет запрос на регистрацию на неверный URL-адрес (http://localhost:3000/register-bad). " +
  "Правильный URL-адрес: http://localhost:3000/register.",
  "Баг фронтенда: фронтенд отправляет запрос с искаженным телом. " +
  "Ключи для имени, электронной почты и пароля сокращены до n, e и p, которые сервер не понимает.",
  "Баг фронтенда: фронтенд отправляет запрос PUT вместо запроса POST. " +
  "Сервер не настроен для обработки запросов PUT для конечной точки /register."
];
