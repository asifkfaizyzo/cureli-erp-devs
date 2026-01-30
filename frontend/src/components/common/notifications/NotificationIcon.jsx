// ============================================
// NOTIFICATION ICON COMPONENT
// Renders appropriate icon based on event type
// ============================================

import React from 'react';
import { getNotificationIconConfig } from '../../../config/notifications';

/**
 * NotificationIcon - Renders icon with background based on event type
 * 
 * @param {string} eventType - Notification event type
 * @param {string} size - Icon size: 'sm' | 'md' | 'lg' (default: 'md')
 * @param {boolean} showBackground - Whether to show background circle (default: true)
 * @param {string} className - Additional classes
 */
const NotificationIcon = ({
  eventType,
  size = 'md',
  showBackground = true,
  className = '',
}) => {
  const config = getNotificationIconConfig(eventType);
  const IconComponent = config.icon;

  // Size configurations
  const sizeConfig = {
    sm: {
      wrapper: 'w-8 h-8',
      icon: 14,
    },
    md: {
      wrapper: 'w-10 h-10',
      icon: 18,
    },
    lg: {
      wrapper: 'w-12 h-12',
      icon: 22,
    },
  };

  const currentSize = sizeConfig[size] || sizeConfig.md;

  if (!showBackground) {
    return (
      <IconComponent
        size={currentSize.icon}
        className={`${config.iconColor} ${className}`}
      />
    );
  }

  return (
    <div
      className={`
        ${currentSize.wrapper} 
        rounded-xl 
        flex items-center justify-center 
        flex-shrink-0
        ${config.bgColor}
        border
        ${config.borderColor}
        ${className}
      `}
    >
      <IconComponent size={currentSize.icon} className={config.iconColor} />
    </div>
  );
};

export default NotificationIcon;