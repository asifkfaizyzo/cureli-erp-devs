// frontend/src/components/common/notifications/NotificationIcon.jsx

import React from 'react';
import { Megaphone } from 'lucide-react';
import { 
  getNotificationIconConfig, 
  isBroadcastNotification,
  NOTIFICATION_EVENTS 
} from '../../../config/notifications';

/**
 * NotificationIcon - Renders appropriate icon for notification type
 */
const NotificationIcon = ({ eventType, size = 'md', className = '' }) => {
  const config = getNotificationIconConfig(eventType);
  const Icon = config.icon;
  const isBroadcast = isBroadcastNotification(eventType);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const iconSizes = {
    sm: 14,
    md: 18,
    lg: 22,
  };

  // Special styling for broadcast notifications
  if (isBroadcast) {
    return (
      <div className={`
        ${sizeClasses[size]} 
        rounded-full 
        bg-gradient-to-br from-indigo-100 to-purple-100
        flex items-center justify-center 
        flex-shrink-0
        ring-2 ring-indigo-200/50
        ${className}
      `}>
        <Megaphone size={iconSizes[size]} className="text-indigo-600" />
      </div>
    );
  }

  return (
    <div className={`
      ${sizeClasses[size]} 
      rounded-full 
      ${config.bgColor} 
      flex items-center justify-center 
      flex-shrink-0
      ${className}
    `}>
      <Icon size={iconSizes[size]} className={config.iconColor} />
    </div>
  );
};

export default NotificationIcon;