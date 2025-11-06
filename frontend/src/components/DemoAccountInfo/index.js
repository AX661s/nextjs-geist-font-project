import React, { useState } from 'react';
import { CloseOutlined, InfoCircleOutlined, CopyOutlined } from '@ant-design/icons';
import { message } from 'antd';
import './DemoAccountInfo.scss';

const DemoAccountInfo = () => {
        const [isVisible, setIsVisible] = useState(true);
        
        const demoAccounts = [
                {
                        label: '管理员账号 (Admin)',
                        email: 'admin@demo.com',
                        password: 'Admin123!',
                        type: 'admin'
                },
                {
                        label: '普通用户账号 (User)',
                        email: 'user@demo.com',
                        password: 'User123!',
                        type: 'user'
                }
        ];
        
        const copyToClipboard = (text, type) => {
                navigator.clipboard.writeText(text).then(() => {
                        message.success(`${type}已复制!`);
                });
        };
        
        if (!isVisible) return null;
        
        return (
                <div className="demo-account-info modern-card fade-in">
                        <div className="demo-account-header">
                                <div className="demo-account-title">
                                        <InfoCircleOutlined className="info-icon" />
                                        <h3>🎯 演示账号 / Demo Accounts</h3>
                                </div>
                                <CloseOutlined 
                                        className="close-icon" 
                                        onClick={() => setIsVisible(false)}
                                />
                        </div>
                        
                        <p className="demo-account-description">
                                使用以下演示账号登录查看现代化界面效果：
                        </p>
                        
                        <div className="demo-accounts-list">
                                {demoAccounts.map((account, index) => (
                                        <div key={index} className={`demo-account-item ${account.type}`}>
                                                <div className="account-label">{account.label}</div>
                                                <div className="account-credential">
                                                        <span className="credential-label">邮箱:</span>
                                                        <code className="credential-value">{account.email}</code>
                                                        <CopyOutlined 
                                                                className="copy-icon"
                                                                onClick={() => copyToClipboard(account.email, '邮箱')}
                                                        />
                                                </div>
                                                <div className="account-credential">
                                                        <span className="credential-label">密码:</span>
                                                        <code className="credential-value">{account.password}</code>
                                                        <CopyOutlined 
                                                                className="copy-icon"
                                                                onClick={() => copyToClipboard(account.password, '密码')}
                                                        />
                                                </div>
                                        </div>
                                ))}
                        </div>
                        
                        <div className="demo-account-note">
                                💡 <strong>提示:</strong> 演示模式下数据为模拟数据，不会保存到真实数据库
                        </div>
                </div>
        );
};

export default DemoAccountInfo;
