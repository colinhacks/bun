// import {plugin} from 'bun';
import Layout from '../components/Layout';
import '../styles/global.css';
import '../styles/docs.css';
import '../styles/output.css';
// import '../styles/docs.scss';

export default function MyApp({Component, pageProps}) {
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}
