import * as Yup from 'Yup';

import User from '../models/User';


class UserController {
	async index(req, res) {
		const users = await User.findAll();
		return res.json(users);
	}

	async store(req, res) {
		const schema = Yup.object().shape({
			name: Yup.string().required(),
			email: Yup.string().email().required(),
			password: Yup.string().required().min(6)
		});

		if(!(await schema.isValid(req.body))) {
			return res.status(400).json({ error: "Dados inválidos" });
		}

		const userExists = await User.findOne({ where: { email: req.body.email } });

		if(userExists) {
			return res.status(400).json({ error: "Email indisponível"});
		}

		const { id, name, email, password } = await User.create(req.body);

		return res.json({ id, name, email })
	}

	async update(req, res) {
		const schema = Yup.object().shape({
			name: Yup.string(),
			email: Yup.string().email(),
			oldPassword: Yup.string().min(6),
			password: Yup.string().min(6).when('oldPassword', (oldPassword, field) => 
				oldPassword ? field.required() : field
			),
			confirmPassword: Yup.string().min(6).when('password', (password, field) => 
				password ? field.required().oneOf([Yup.ref('password')]) : field
			)
		});

		if(!(await schema.isValid(req.body))) {
			return res.status(400).json({ error: "Dados inválidos" });
		}

		const user = await User.findByPk(req.userId);
		const { name, email, oldPassword } = req.body;

		if(email && email !== user.email) {
			const userExists = await User.findOne({ where: { email } });
			if(userExists) {
				return res.status(400).json({ error: 'Email indisponível' });
			}
		}

		if(oldPassword && !(await user.checkPassword(oldPassword))) {
			return res.status(400).json({ error: 'Senha antiga inválida' })
		}

		await user.update(req.body);

		return res.json({ id: req.userId, name, email });
	}
}

export default new UserController;