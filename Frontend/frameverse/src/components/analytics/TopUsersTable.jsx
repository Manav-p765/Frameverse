import React, { useState } from 'react';

const TopUsersTable = ({ data }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const totalPages = Math.ceil((data?.length || 0) / itemsPerPage);
    const currentData = data?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage) || [];

    return (
        <div className="bg-bg-secondary p-5 rounded-2xl shadow-sm border border-border-color h-full flex flex-col">
            <h3 className="text-text-primary font-bold mb-4">Top Active Users</h3>

            <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-border-color">
                            <th className="py-3 px-4 text-text-secondary font-medium text-sm">User</th>
                            <th className="py-3 px-4 text-text-secondary font-medium text-sm">Messages Sent</th>
                            <th className="py-3 px-4 text-text-secondary font-medium text-sm">Last Active</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentData.length === 0 ? (
                            <tr>
                                <td colSpan="3" className="py-6 text-center text-text-secondary">No user data available</td>
                            </tr>
                        ) : (
                            currentData.map((user, idx) => (
                                <tr
                                    key={user._id}
                                    className="border-b border-border-color/50 hover:bg-bg-primary/50 transition-colors"
                                >
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={user.avatar || `https://ui-avatars.com/api/?name=${user.username}&background=random`}
                                                alt={user.username}
                                                className="w-8 h-8 rounded-full object-cover"
                                            />
                                            <span className="text-text-primary font-medium">{user.username}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className="bg-brand-purple/10 text-brand-purple px-2 py-1 rounded-md font-bold text-sm">
                                            {user.messageCount.toLocaleString()}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-text-secondary text-sm">
                                        {new Date(user.lastActive).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-border-color">
                    <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => p - 1)}
                        className="px-3 py-1 bg-bg-primary text-text-secondary rounded-lg disabled:opacity-50 hover:text-text-primary transition-colors text-sm"
                    >
                        Previous
                    </button>
                    <span className="text-text-secondary text-xs">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(p => p + 1)}
                        className="px-3 py-1 bg-bg-primary text-text-secondary rounded-lg disabled:opacity-50 hover:text-text-primary transition-colors text-sm"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default TopUsersTable;
