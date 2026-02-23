import './style.css';
import { registerRoute, initRouter } from './router.js';
import { renderLogin } from './pages/login.js';
import { renderCadastro } from './pages/cadastro.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderConfiguracoes } from './pages/configuracoes.js';
import { renderRegistroHoras } from './pages/registro-horas.js';
import { renderRecibos } from './pages/recibos.js';
import { renderDespesas } from './pages/despesas.js';
import { renderDeclaracao } from './pages/declaracao.js';
import { renderHistorico } from './pages/historico.js';

// Registrar todas as rotas
registerRoute('/login', renderLogin);
registerRoute('/cadastro', renderCadastro);
registerRoute('/dashboard', renderDashboard);
registerRoute('/configuracoes', renderConfiguracoes);
registerRoute('/registro-horas', renderRegistroHoras);
registerRoute('/recibos', renderRecibos);
registerRoute('/despesas', renderDespesas);
registerRoute('/declaracao', renderDeclaracao);
registerRoute('/historico', renderHistorico);

// Inicializar o roteador
initRouter();

