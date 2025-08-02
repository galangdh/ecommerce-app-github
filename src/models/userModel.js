const pool = require('../config/db');

const UserModel={
    create: async (username, password, role) =>{
        const [result] = await pool.execute(
            'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
            [username, password, role]
        );
        return result.insertId;
    },
    //mencari pengguna berdasakan username
    findByUsername: async (username) => {
        const [rows] = await pool.execute(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );
        return rows[0]; // Mengembalikan pengguna pertama yang ditemukan
    },
    //mencari pengguna berdasarkan id
    findById: async (id) => {
        const [rows] = await pool.execute(
            'SELECT * FROM users WHERE id = ?',
            [id]
        );
        return rows[0]; // Mengembalikan pengguna pertama yang ditemukan
    },
    //update pengguna
    update: async (id, username, password, role) => {
        const [result] = await pool.execute(
            'UPDATE users SET username = ?, password = ?, role = ? WHERE id = ?',
            [username, password, role, id]
        );
        return result.affectedRows > 0; // Mengembalikan true jika ada yang diupdate
    },
    //menghapus pengguna
    delete: async (id) => {
        const [result] = await pool.execute(
            'DELETE FROM users WHERE id = ?',
            [id]
        );
        return result.affectedRows > 0; // Mengembalikan true jika ada yang dihapus
    },
    // Mendapatkan semua pengguna
    getAll: async () => {
        const [rows] = await pool.execute('SELECT * FROM users');
        return rows; // Mengembalikan semua pengguna
    }
};

module.exports = UserModel;