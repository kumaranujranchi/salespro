import React from 'react';
import Joyride, { Step, CallBackProps, STATUS } from 'react-joyride';
import { useTutorial } from '../../contexts/TutorialContext';

export const AppTutorial: React.FC = () => {
  const { run, stepIndex, handleJoyrideCallback } = useTutorial();

  // Define steps targeting specific IDs
  // These IDs must be added to the respective components
  const steps: Step[] = [
    {
      target: 'body',
      placement: 'center',
      title: 'Welcome to SalesPro',
      content: (
        <div className="text-left">
          <h3 className="font-bold text-lg mb-2">Let's get you valid started!</h3>
          <p>This quick tour will help you navigate the application and understand key features.</p>
        </div>
      ),
      disableBeacon: true,
    },
    {
      target: '#module-toggle',
      title: 'Module Switcher',
      content: 'Easily switch between Sales and CRM modules based on your current task. Each module has its own dedicated dashboard and tools.',
    },
    {
      target: '#sidebar-nav',
      title: 'Navigation Menu',
      content: 'Access all features and pages here. The menu items update automatically when you switch modules.',
      placement: 'right',
    },
    {
      target: '#theme-toggle',
      title: 'Appearance',
      content: 'Toggle between Light and Dark mode to customize your viewing experience.',
    },
    {
      target: '#notification-bell',
      title: 'Notifications',
      content: 'Stay updated with important alerts, reminders, and system notifications.',
    },
    {
      target: '#user-profile',
      title: 'Your Account',
      content: 'Manage your profile settings, security preferences, and sign out from here.',
    },
    {
      target: '#help-button',
      title: 'Need Help?',
      content: 'Click this button anytime to restart this tutorial or access support.',
    }
  ];

  return (
    <Joyride
      steps={steps}
      run={run}
      stepIndex={stepIndex}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: '#4F46E5', // Indigo-600
          textColor: '#333',
          backgroundColor: '#fff',
          overlayColor: 'rgba(0, 0, 0, 0.5)',
        },
        buttonNext: {
          backgroundColor: '#4F46E5',
          fontSize: 14,
          padding: '8px 16px',
          borderRadius: 4
        },
        buttonBack: {
          color: '#4F46E5',
          marginRight: 10
        }
      }}
      locale={{
        last: 'Finish',
        skip: 'Skip Tutorial',
        next: 'Next',
        back: 'Previous'
      }}
    />
  );
};
