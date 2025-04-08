import User from '../models/User.js';
import bcrypt from 'bcryptjs';

const initializeAdmin = async () => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const admin = await User.create({
        name: 'Admin',
        email: 'admin@sotupub.com',
        password: hashedPassword,
        role: 'admin',
        phoneNumber: '12345678'
      });
      
      console.log('Admin user created successfully');
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
};

export default initializeAdmin;