import { useEffect, useState } from 'react';
import { Clock, AlertCircle } from 'lucide-react';

interface CountdownProps {
  fechaCierre: string;
  onExpired?: () => void;
  className?: string;
  showIcon?: boolean;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

export const Countdown: React.FC<CountdownProps> = ({
  fechaCierre,
  onExpired,
  className = '',
  showIcon = true
}) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0
  });

  useEffect(() => {
    const calculateTimeLeft = (): TimeLeft => {
      const difference = new Date(fechaCierre).getTime() - new Date().getTime();

      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        total: difference
      };
    };

    // Calcular inmediatamente
    const initial = calculateTimeLeft();
    setTimeLeft(initial);

    if (initial.total <= 0 && onExpired) {
      onExpired();
      return;
    }

    // Actualizar cada segundo
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);

      if (newTimeLeft.total <= 0) {
        clearInterval(timer);
        if (onExpired) {
          onExpired();
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [fechaCierre, onExpired]);

  // Determinar color según tiempo restante
  const getColorClass = () => {
    if (timeLeft.total <= 0) {
      return 'text-gray-500';
    }
    if (timeLeft.total <= 60000) { // Último minuto
      return 'text-red-600 animate-pulse';
    }
    if (timeLeft.total <= 300000) { // Últimos 5 minutos
      return 'text-orange-600';
    }
    if (timeLeft.total <= 3600000) { // Última hora
      return 'text-yellow-600';
    }
    return 'text-green-600';
  };

  // Formatear componente de tiempo
  const TimeUnit = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="text-3xl font-bold leading-none">
        {value.toString().padStart(2, '0')}
      </div>
      <div className="text-sm text-gray-500 uppercase mt-1">{label}</div>
    </div>
  );

  if (timeLeft.total <= 0) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <AlertCircle className="w-6 h-6 text-gray-500" />
        <span className="text-lg font-medium text-gray-500">Subasta Cerrada</span>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="flex items-center gap-4">
        {showIcon && (
          <Clock className={`w-6 h-6 ${getColorClass()}`} />
        )}
        <div className={`flex items-center gap-4 ${getColorClass()}`}>
          {timeLeft.days > 0 && (
            <>
              <TimeUnit value={timeLeft.days} label="días" />
              <span className="text-2xl font-bold">:</span>
            </>
          )}
          <TimeUnit value={timeLeft.hours} label="hrs" />
          <span className="text-2xl font-bold">:</span>
          <TimeUnit value={timeLeft.minutes} label="min" />
          <span className="text-2xl font-bold">:</span>
          <TimeUnit value={timeLeft.seconds} label="seg" />
        </div>
      </div>

      {/* Mensaje de urgencia */}
      {timeLeft.total <= 60000 && timeLeft.total > 0 && (
        <div className="mt-3 text-base font-semibold text-red-600 animate-pulse">
          ⚠️ ¡Último minuto!
        </div>
      )}
      {timeLeft.total <= 300000 && timeLeft.total > 60000 && (
        <div className="mt-3 text-base font-medium text-orange-600">
          ⏰ Quedan menos de 5 minutos
        </div>
      )}
    </div>
  );
};

// Versión compacta para listados
export const CountdownCompact: React.FC<CountdownProps> = ({
  fechaCierre,
  className = ''
}) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0
  });

  useEffect(() => {
    const calculateTimeLeft = (): TimeLeft => {
      const difference = new Date(fechaCierre).getTime() - new Date().getTime();

      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        total: difference
      };
    };

    const initial = calculateTimeLeft();
    setTimeLeft(initial);

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [fechaCierre]);

  const getColorClass = () => {
    if (timeLeft.total <= 0) return 'text-gray-500';
    if (timeLeft.total <= 60000) return 'text-red-600 font-bold animate-pulse';
    if (timeLeft.total <= 300000) return 'text-orange-600 font-semibold';
    if (timeLeft.total <= 3600000) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (timeLeft.total <= 0) {
    return <span className="text-sm text-gray-500 font-medium">Cerrada</span>;
  }

  const formatTime = () => {
    if (timeLeft.days > 0) {
      return `${timeLeft.days}d ${timeLeft.hours}h`;
    }
    if (timeLeft.hours > 0) {
      return `${timeLeft.hours}h ${timeLeft.minutes}m`;
    }
    if (timeLeft.minutes > 0) {
      return `${timeLeft.minutes}m ${timeLeft.seconds}s`;
    }
    return `${timeLeft.seconds}s`;
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Clock className={`w-4 h-4 ${getColorClass()}`} />
      <span className={`text-sm font-medium ${getColorClass()}`}>
        {formatTime()}
      </span>
    </div>
  );
};
