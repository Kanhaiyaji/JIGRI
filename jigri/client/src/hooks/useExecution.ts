import { useState, useCallback } from 'react';
import { socket } from '../services/socket';

export const useExecution = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState('');

  const execute = useCallback(() => {
    setIsRunning(true);
    setOutput('');
    setTimeout(() => {
      setOutput('Execution completed.');
      setIsRunning(false);
    }, 1000);
  }, []);

  return { execute, output, isRunning };
};