
import { Client, Product, Appointment, AppointmentStatus, User, UserRole, CertificateAuthority } from '../types';

// Interface interna para o Mock DB incluir senha
interface DBUser extends User {
  password?: string;
}

const INITIAL_USERS: DBUser[] = [
  { id: '1', name: 'Administrador', email: 'admin@certflow.com', role: UserRole.ADMIN, password: 'admin' },
  { id: '2', name: 'Agente de Validação', email: 'agente@certflow.com', role: UserRole.AGENT, password: '123' }
];

const INITIAL_ACS: CertificateAuthority[] = [
  { id: '1', name: 'Soluti', apiUrl: 'https://api.soluti.com.br/v2', status: 'ACTIVE' },
  { id: '2', name: 'Valid', apiUrl: 'https://api.valid.com/issue', status: 'ACTIVE' },
  { id: '3', name: 'Serasa', apiUrl: 'https://services.serasa.com.br', status: 'INACTIVE' },
];

const INITIAL_CLIENTS: Client[] = [
  { id: '1', name: 'Empresa Tech Solutions Ltda', document: '12.345.678/0001-90', email: 'contato@techsol.com', phone: '(11) 99999-9999', type: 'PJ' },
  { id: '2', name: 'João da Silva', document: '123.456.789-00', email: 'joao.silva@email.com', phone: '(11) 98888-8888', type: 'PF' },
  { id: '3', name: 'Maria Oliveira Advogados', document: '98.765.432/0001-10', email: 'maria@adv.com', phone: '(21) 97777-7777', type: 'PJ' },
];

const INITIAL_PRODUCTS: Product[] = [
  { id: '1', name: 'e-CNPJ A1', description: 'Certificado Digital para Empresas (Arquivo)', price: 250.00, validityMonths: 12, type: 'A1' },
  { id: '2', name: 'e-CPF A3', description: 'Certificado Digital Pessoa Física + Token', price: 350.00, validityMonths: 36, type: 'A3' },
  { id: '3', name: 'e-CNPJ Nuvem', description: 'Certificado em Nuvem (BirdID)', price: 150.00, validityMonths: 12, type: 'CLOUD' },
  { id: '4', name: 'e-CPF A1', description: 'Certificado Digital Pessoa Física (Arquivo)', price: 180.00, validityMonths: 12, type: 'A1' },
];

const INITIAL_APPOINTMENTS: Appointment[] = [
  { id: '1', clientId: '1', productId: '1', acId: '1', date: new Date(new Date().setHours(10, 0, 0, 0)).toISOString(), status: AppointmentStatus.SCHEDULED, notes: 'Validar contrato social' },
  { id: '2', clientId: '2', productId: '4', acId: '2', date: new Date(new Date().setHours(14, 30, 0, 0)).toISOString(), status: AppointmentStatus.COMPLETED, notes: 'Tudo certo' },
  { id: '3', clientId: '3', productId: '1', acId: '1', status: AppointmentStatus.PENDING, notes: 'Aguardando cliente confirmar horário' },
];

// Simulating a Database Service
class MockDatabase {
  private users: DBUser[] = INITIAL_USERS;
  private acs: CertificateAuthority[] = INITIAL_ACS;
  private clients: Client[] = INITIAL_CLIENTS;
  private products: Product[] = INITIAL_PRODUCTS;
  private appointments: Appointment[] = INITIAL_APPOINTMENTS;

  // Authentication (Users Table)
  authenticate(email: string, pass: string): User | null {
    const user = this.users.find(u => u.email === email && u.password === pass);
    if (user) {
        // Retorna usuário sem a senha
        const { password, ...safeUser } = user;
        return safeUser;
    }
    return null;
  }

  // ACs (Autoridades Certificadoras)
  getACs(): CertificateAuthority[] { return [...this.acs]; }
  addAC(ac: Omit<CertificateAuthority, 'id'>): CertificateAuthority {
    const newAC = { ...ac, id: Math.random().toString(36).substr(2, 9) };
    this.acs.push(newAC);
    return newAC;
  }
  updateAC(id: string, data: Partial<CertificateAuthority>): CertificateAuthority | null {
    const index = this.acs.findIndex(a => a.id === id);
    if (index === -1) return null;
    this.acs[index] = { ...this.acs[index], ...data };
    return this.acs[index];
  }
  deleteAC(id: string) { this.acs = this.acs.filter(a => a.id !== id); }

  // Clients
  getClients(): Client[] { return [...this.clients]; }
  addClient(client: Omit<Client, 'id'>): Client {
    const newClient = { ...client, id: Math.random().toString(36).substr(2, 9) };
    this.clients.push(newClient);
    return newClient;
  }
  updateClient(id: string, data: Partial<Client>): Client | null {
    const index = this.clients.findIndex(c => c.id === id);
    if (index === -1) return null;
    this.clients[index] = { ...this.clients[index], ...data };
    return this.clients[index];
  }
  deleteClient(id: string) { this.clients = this.clients.filter(c => c.id !== id); }

  // Products
  getProducts(): Product[] { return [...this.products]; }
  addProduct(product: Omit<Product, 'id'>): Product {
    const newProduct = { ...product, id: Math.random().toString(36).substr(2, 9) };
    this.products.push(newProduct);
    return newProduct;
  }
  updateProduct(id: string, data: Partial<Product>): Product | null {
    const index = this.products.findIndex(p => p.id === id);
    if (index === -1) return null;
    this.products[index] = { ...this.products[index], ...data };
    return this.products[index];
  }
  deleteProduct(id: string) { this.products = this.products.filter(p => p.id !== id); }

  // Appointments / Orders
  getAppointments(): Appointment[] { return [...this.appointments]; }
  addAppointment(apt: Omit<Appointment, 'id'>): Appointment {
    const newApt = { ...apt, id: Math.random().toString(36).substr(2, 9) };
    this.appointments.push(newApt);
    return newApt;
  }
  updateAppointment(id: string, data: Partial<Appointment>): Appointment | null {
    const index = this.appointments.findIndex(a => a.id === id);
    if (index === -1) return null;
    this.appointments[index] = { ...this.appointments[index], ...data };
    return this.appointments[index];
  }
  updateAppointmentStatus(id: string, status: AppointmentStatus) {
    this.appointments = this.appointments.map(a => a.id === id ? { ...a, status } : a);
  }

  // Joined Data for Views
  getOrdersDisplay(): any[] {
    return this.appointments.map(apt => {
      const client = this.clients.find(c => c.id === apt.clientId);
      const product = this.products.find(p => p.id === apt.productId);
      const ac = this.acs.find(a => a.id === apt.acId);
      return {
        ...apt,
        clientName: client?.name || 'Unknown Client',
        productName: product?.name || 'Unknown Product',
        productPrice: product?.price || 0,
        acName: ac?.name || 'N/A'
      };
    });
  }
}

export const db = new MockDatabase();
