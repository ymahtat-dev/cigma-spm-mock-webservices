const jsonServer = require('json-server');
const jwt = require('jsonwebtoken');
const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();
const bodyParser = require('body-parser');

const SECRET_KEY = 'cigma-test-secret';
const expiresIn = '1h';

server.use(middlewares);
server.use(bodyParser.json());

server.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", null); // Suppression de l'en-tête CORS
    //res.header("Access-Control-Allow-Origin", "*"); // allow all origins de l'en-tête CORS
    next();
});


// Endpoints pour récupérer les données maîtres (sans auth)
server.get('/api/masterdata/user-types', (req, res) => {
    const userTypes = router.db.get('masterdata.user-types').value();
    res.json(userTypes);
});

server.get('/api/masterdata/studies-types', (req, res) => {
    const studiesTypes = router.db.get('masterdata.studies-types').value();
    res.json(studiesTypes);
});

server.get('/api/masterdata/status-flows', (req, res) => {
    const statusFlows = router.db.get('masterdata.status-flows').value();
    res.json(statusFlows);
});

server.get('/api/masterdata/task-types', (req, res) => {
    const taskTypes = router.db.get('masterdata.task-types').value();
    res.json(taskTypes);
});

// Middleware d'authentification
server.post('/api/auth/login', (req, res) => {
    const {username, password} = req.body;
    const users = router.db.get('users').value();
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        const token = jwt.sign({
            id: user.id,
            username: user.username,
            userType: user.userType
        }, SECRET_KEY, {expiresIn});
        res.status(200).json({
            message: 'Login successful',
            token
        });
    } else {
        res.status(401).json({message: 'Invalid username or password'});
    }
});

// Middleware pour valider le token
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, SECRET_KEY, (err, user) => {
            if (err) {
                console.error(err);
                return res.sendStatus(403);
            }
            req.user = user;
            next();
        });
    } else {
        res.sendStatus(401);
    }
};

// Route pour valider le token
server.get('/api/auth/validate-token', authenticateJWT, (req, res) => {
    res.status(200).json({
        message: 'Token is valid',
        user: req.user
    });
});

// Route pour récupérer le profil de l'utilisateur
server.get('/api/auth/profile', authenticateJWT, (req, res) => {
    const user = router.db.get('users').find({id: req.user.id}).value();
    if (user) {
        const userProfile = JSON.parse(JSON.stringify(user));
        delete userProfile.password;
        res.json(userProfile);
    } else {
        res.status(404).json({message: 'User not found'});
    }
});

// Route pour modifier son mot de passe
server.put('/api/auth/update-password', authenticateJWT, (req, res) => {
    const {oldPassword, newPassword} = req.body;
    const user = router.db.get('users').find({id: req.user.id}).value();
    if (user && user.password === oldPassword) {
        router.db.get('users').find({id: req.user.id}).assign({password: newPassword}).write();
        res.status(200).json({message: 'Password updated successfully'});
    } else {
        res.status(400).json({message: 'Incorrect old password'});
    }
});

// Route pour déconnexion
server.post('/api/auth/logout', authenticateJWT, (req, res) => {
    // Invalidate token logic can be implemented here if needed
    res.status(200).json({message: 'Logout successful'});
});

// Gestion des utilisateurs (Admin seulement)
server.use('/api/users', authenticateJWT, (req, res, next) => {
    if (req.user.userType !== 'admin') {
        res.sendStatus(403);
    } else {
        next();
    }
});

server.get('/api/users', (req, res) => {
    const users = router.db.get('users').value();
    const recoveredUsers = JSON.parse(JSON.stringify(users));
    if (recoveredUsers) {
        recoveredUsers.forEach(user => {
            delete user.password;
        });
    }
    res.json(recoveredUsers);
});

server.post('/api/users', authenticateJWT, (req, res) => {
    if (req.user.userType !== 'admin') {
        return res.sendStatus(403);
    }
    const userPayload = req.body;
    const userToCreate = {
        id: router.db.get('users').value().length + 1,
        firstname: userPayload.firstname,
        lastname: userPayload.lastname,
        username: userPayload.username,
        password: userPayload.password,
        gender: userPayload.gender,
        birthdate: userPayload.birthdate,
        email: userPayload.email,
        picture: userPayload.picture,
        userType: userPayload.userType,
        studentId: userPayload.studentId
    };
    router.db.get('users').push(userToCreate).write();
    const createdUser = JSON.parse(JSON.stringify(userToCreate));
    delete createdUser.password;
    res.status(201).json(createdUser);
});

server.put('/api/users/:id', authenticateJWT, (req, res) => {
    if (req.user.userType !== 'admin') {
        return res.sendStatus(403);
    }
    const {id} = req.params;
    const userPayload = req.body;
    router.db.get('users').find({id: parseInt(id)}).assign(userPayload).write();
    const updatedUser = JSON.parse(JSON.stringify(userPayload));
    delete updatedUser.password;
    res.status(200).json(updatedUser);
});

server.delete('/api/users/:id', authenticateJWT, (req, res) => {
    if (req.user.userType !== 'admin') {
        return res.sendStatus(403);
    }
    const {id} = req.params;
    router.db.get('users').remove({id: parseInt(id)}).write();
    res.sendStatus(204);
});

// Gestion des étudiants
server.use('/api/students', authenticateJWT, (req, res, next) => {
    if (!req.user.userType) {
        res.sendStatus(400);
    } else {
        next();
    }
});

server.get('/api/students', (req, res) => {
    const users = router.db.get('users').value().filter(u => u.userType === 'student');
    const recoveredStudents = JSON.parse(JSON.stringify(users));
    if (recoveredStudents) {
        recoveredStudents.forEach(student => {
            delete student.password;
        });
    }
    res.json(recoveredStudents);
});

server.post('/api/students', authenticateJWT, (req, res) => {
    if (req.user.userType !== 'admin') {
        return res.sendStatus(403);
    }
    const studentPayload = req.body;
    const studentToCreate = {
        id: router.db.get('users').value().length + 1,
        firstname: studentPayload.firstname,
        lastname: studentPayload.lastname,
        username: studentPayload.username,
        password: studentPayload.password,
        gender: studentPayload.gender,
        birthdate: studentPayload.birthdate,
        email: studentPayload.email,
        picture: studentPayload.picture,
        userType: 'student',
        studentId: studentPayload.studentId,
        study: studentPayload.study
    };
    router.db.get('users').push(studentToCreate).write();
    const createdStudent = JSON.parse(JSON.stringify(studentToCreate));
    delete createdStudent.password;
    res.status(201).json(createdStudent);
});

// Gestion des projets
server.get('/api/projects', authenticateJWT, (req, res) => {
    const projects = req.user.userType === 'admin' ? router.db.get('projects').value() : router.db.get('projects').filter(p => p.studentsMembers.includes(req.user.id)).value();
    res.json(projects);
});

server.post('/api/projects', authenticateJWT, (req, res) => {
    if (req.user.userType !== 'student') {
        return res.sendStatus(403);
    }
    const projectPayload = req.body;
    const projectToCreate = {
        id: router.db.get('projects').value().length + 1,
        name: projectPayload.name,
        description: projectPayload.description,
        type: projectPayload.type,
        status: projectPayload.status,
        startDate: projectPayload.startDate,
        provisionalEndDate: projectPayload.provisionalEndDate,
        endDate: projectPayload.endDate,
        responsibleStudentId: req.user.id,
        studentsMembers: [req.user.id]
    };
    router.db.get('projects').push(projectToCreate).write();
    res.status(201).json(projectToCreate);
});

server.put('/api/projects/:id', authenticateJWT, (req, res) => {
    const {id} = req.params;
    const project = router.db.get('projects').find({id: parseInt(id)}).value();
    if (req.user.userType === 'admin' || project.responsibleStudentId === req.user.id) {
        router.db.get('projects').find({id: parseInt(id)}).assign(req.body).write();
        res.status(200).json(req.body);
    } else {
        res.sendStatus(403);
    }
});

server.delete('/api/projects/:id', authenticateJWT, (req, res) => {
    const {id} = req.params;
    const project = router.db.get('projects').find({id: parseInt(id)}).value();
    if (req.user.userType === 'admin' || project.responsibleStudentId === req.user.id) {
        router.db.get('projects').remove({id: parseInt(id)}).write();
        res.sendStatus(204);
    } else {
        res.sendStatus(403);
    }
});

server.get('/api/projects/:id', authenticateJWT, (req, res) => {
    const {id} = req.params;
    const project = router.db.get('projects').find({id: parseInt(id)}).value();
    if (req.user.userType === 'admin' || project.responsibleStudentId === req.user.id || project.studentsMembers.includes(req.user.id)) {
        res.json(project);
    } else {
        res.sendStatus(403);
    }
});

// Gestion des tâches
server.get('/api/tasks', authenticateJWT, (req, res) => {
    const tasks = req.user.userType === 'admin' ? router.db.get('tasks').value() : router.db.get('tasks').filter(t => t.userId === req.user.id).value();
    res.json(tasks);
});

server.get('/api/projects/:projectId/tasks', authenticateJWT, (req, res) => {
    const {projectId} = req.params;
    const project = router.db.get('projects').find({id: parseInt(projectId)}).value();
    if (req.user.userType === 'admin' || project.responsibleStudentId === req.user.id || project.studentsMembers.includes(req.user.id)) {
        const tasks = router.db.get('tasks').filter(t => t.projectId === parseInt(projectId)).value();
        res.json(tasks);
    } else {
        res.sendStatus(403);
    }
});

server.post('/api/projects/:projectId/tasks', authenticateJWT, (req, res) => {
    const {projectId} = req.params;
    const project = router.db.get('projects').find({id: parseInt(projectId)}).value();
    if (req.user.userType === 'admin' || project.responsibleStudentId === req.user.id || project.studentsMembers.includes(req.user.id)) {
        const taskPayload = req.body;
        const taskToCreate = {
            id: router.db.get('tasks').value().length + 1,
            name: taskPayload.name,
            description: taskPayload.description,
            type: taskPayload.type,
            status: taskPayload.status,
            startDate: taskPayload.startDate,
            provisionalEndDate: taskPayload.provisionalEndDate,
            endDate: taskPayload.endDate,
            projectId: parseInt(projectId),
            userId: req.user.id
        };
        router.db.get('tasks').push(taskToCreate).write();
        res.status(201).json(taskToCreate);
    } else {
        res.sendStatus(403);
    }
});

server.put('/api/tasks/:id', authenticateJWT, (req, res) => {
    const {id} = req.params;
    const task = router.db.get('tasks').find({id: parseInt(id)}).value();
    if (req.user.userType === 'admin' || task.userId === req.user.id) {
        const taskPayload = req.body;
        router.db.get('tasks').find({id: parseInt(id)}).assign(taskPayload).write();
        res.status(200).json(taskPayload);
    } else {
        res.sendStatus(403);
    }
});

server.delete('/api/tasks/:id', authenticateJWT, (req, res) => {
    const {id} = req.params;
    const task = router.db.get('tasks').find({id: parseInt(id)}).value();
    if (req.user.userType === 'admin' || task.userId === req.user.id) {
        router.db.get('tasks').remove({id: parseInt(id)}).write();
        res.sendStatus(204);
    } else {
        res.sendStatus(403);
    }
});

server.get('/api/tasks/:id', authenticateJWT, (req, res) => {
    const {id} = req.params;
    const task = router.db.get('tasks').find({id: parseInt(id)}).value();
    if (req.user.userType === 'admin' || task.userId === req.user.id) {
        res.json(task);
    } else {
        res.sendStatus(403);
    }
});

// Gestion des commentaires
server.get('/api/comments', authenticateJWT, (req, res) => {
    const comments = req.user.userType === 'admin' ? router.db.get('comments').value() : router.db.get('comments').filter(c => c.userId === req.user.id).value();
    res.json(comments);
});

server.get('/api/tasks/:taskId/comments', authenticateJWT, (req, res) => {
    const {taskId} = req.params;
    const task = router.db.get('tasks').find({id: parseInt(taskId)}).value();
    if (req.user.userType === 'admin' || task.userId === req.user.id) {
        const comments = router.db.get('comments').filter(c => c.taskId === parseInt(taskId)).value();
        res.json(comments);
    } else {
        res.sendStatus(403);
    }
});

server.post('/api/tasks/:taskId/comments', authenticateJWT, (req, res) => {
    const {taskId} = req.params;
    const task = router.db.get('tasks').find({id: parseInt(taskId)}).value();
    if (req.user.userType === 'admin' || task.userId === req.user.id) {
        const commentPayload = req.body;
        const commentToCreate = {
            id: router.db.get('comments').value().length + 1,
            text: commentPayload.text,
            taskId: parseInt(taskId),
            userId: req.user.id
        };
        router.db.get('comments').push(commentToCreate).write();
        res.status(201).json(commentToCreate);
    } else {
        res.sendStatus(403);
    }
});

server.put('/api/comments/:id', authenticateJWT, (req, res) => {
    const {id} = req.params;
    const comment = router.db.get('comments').find({id: parseInt(id)}).value();
    if (req.user.userType === 'admin' || comment.userId === req.user.id) {
        const commentPayload = req.body;
        router.db.get('comments').find({id: parseInt(id)}).assign(commentPayload).write();
        res.status(200).json(commentPayload);
    } else {
        res.sendStatus(403);
    }
});

server.delete('/api/comments/:id', authenticateJWT, (req, res) => {
    const {id} = req.params;
    const comment = router.db.get('comments').find({id: parseInt(id)}).value();
    if (req.user.userType === 'admin' || comment.userId === req.user.id) {
        router.db.get('comments').remove({id: parseInt(id)}).write();
        res.sendStatus(204);
    } else {
        res.sendStatus(403);
    }
});

server.get('/api/comments/:id', authenticateJWT, (req, res) => {
    const {id} = req.params;
    const comment = router.db.get('comments').find({id: parseInt(id)}).value();
    if (req.user.userType === 'admin' || comment.userId === req.user.id) {
        res.json(comment);
    } else {
        res.sendStatus(403);
    }
});


// Utiliser le routeur par défaut avec le préfixe /api
server.use('/api', router);


server.listen(3000, () => {
    console.log('JSON Server is running on port 3000');
});
