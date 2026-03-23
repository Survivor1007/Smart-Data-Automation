// Basic toast notification instead of using alert 

import { useEffect } from "react";

interface ToastProps{
      message:string;
      type?:'success'|'error'|'info';
      duration?:number;
      onClose: () => void;
}

export default function Toast({message, type = 'info', duration  = 4000, onClose}: ToastProps){
      useEffect(() => {
            const timer = setTimeout(onClose, duration);
            return () => clearTimeout(timer);
      },[duration, onClose]);

      const bgColor = {
            success:'bg-green-500',
            error:'bg-red-500',
            info:'bg-blue-500'
      }[type];

      return (
            <div
      className={`fixed bottom-6 right-6 z-50 px-6 py-3 rounded-lg shadow-lg text-white ${bgColor} animate-fade-in-up`}
    >
      {message}
    </div>
      );
} 