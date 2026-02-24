/**
 * Email Template Management System
 * Main App component with Admin Panel for email template creation
 */

import { useState } from 'react';
import AdminEmailPage from './admin/pages/AdminEmailPage';

import './App.css';
import './admin/styles/admin.css';

export default function App() {
	const [currentPage, setCurrentPage] = useState('admin');

	return (
		<>
			{currentPage === 'admin' && (
				<AdminEmailPage />
			)}
		</>
	);
}
