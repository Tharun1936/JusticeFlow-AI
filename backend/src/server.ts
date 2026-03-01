import app from './app.js';
import { PORT } from './config/env.js';

const port = PORT || 4000;

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on http://localhost:${port}`);
});
