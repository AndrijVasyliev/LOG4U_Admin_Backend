import { HelmetOptions } from 'helmet';

const helmetOptions: HelmetOptions = {
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'", 'maps.googleapis.com'],
      connectSrc: ["'self'", 'data:', '*.gstatic.com', '*.googleapis.com'],
      fontSrc: ["'self'", 'fonts.googleapis.com', 'fonts.gstatic.com'],
      scriptSrc: ["'self'", "'unsafe-eval'", 'maps.googleapis.com'],
      workerSrc: ["'self'", 'blob:'],
      frameSrc: ["'self'", 'blob:'],
      objectSrc: ["'self'", 'blob:'],
      imgSrc: [
        "'self'",
        'data:',
        '*.gstatic.com',
        '*.googleapis.com',
        '*.google.com',
        '*.ggpht.com',
      ],
    },
  },
};

export default helmetOptions;
