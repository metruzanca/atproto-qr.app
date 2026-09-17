import { onMount, type JSX } from 'solid-js';
import { Route, Router } from '@solidjs/router';

import { initAuth } from './lib/atproto/auth';
import { Header } from './components/Header';
import Home from './pages/Home';
import Login from './pages/Login';
import Callback from './pages/Callback';
import Mine from './pages/Mine';
import QRPublic from './pages/QRPublic';
import Editor from './pages/Editor';

function Root(props: { children?: JSX.Element }) {
  return (
    <div class="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Header />
      <div class="flex-1">{props.children}</div>
      <footer class="border-t border-slate-200 bg-white">
        <div class="mx-auto max-w-6xl px-4 py-6 text-center text-xs text-slate-500">
          Your QR codes are stored as records in your own atproto personal data server (PDS). We can't edit, hide, or
          delete them.
        </div>
      </footer>
    </div>
  );
}

const App = () => {
  onMount(() => {
    void initAuth();
  });

  return (
    <Router root={Root}>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/oauth/callback" component={Callback} />
      <Route path="/mine" component={Mine} />
      <Route path="/:handle/:id" component={QRPublic} />
      <Route path="/:handle/:id/edit" component={Editor} />
    </Router>
  );
};

export default App;