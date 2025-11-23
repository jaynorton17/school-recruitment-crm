import React from 'react';
import { DashboardIcon, SchoolIcon, TaskIcon, NotesIcon, EmailIcon, CallIcon, PhoneOutgoingIcon, CloseIcon, ReportIcon, OpportunitiesIcon, WorkflowIcon, QrCodeIcon, AiIcon, UsersIcon, DollarIcon } from './icons';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isSuperAdmin: boolean;
  onOpenQrCodeModal: () => void;
}

const NavItem: React.FC<{
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon: Icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-3 text-left text-sm font-medium rounded-lg transition-all duration-200 ${
      isActive
        ? 'bg-slate-800 text-white'
        : 'text-slate-400 hover:bg-slate-700 hover:text-white'
    }`}
  >
    <Icon className="w-5 h-5" />
    <span>{label}</span>
  </button>
);

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, isOpen, setIsOpen, isSuperAdmin, onOpenQrCodeModal }) => {
  const handleNavItemClick = (view: string) => {
    setActiveView(view);
    setIsOpen(false);
  };

  const handleQrCodeClick = () => {
    onOpenQrCodeModal();
    setIsOpen(false);
  };

  const mainNavItems = [
    { id: 'Dashboard', icon: DashboardIcon, label: 'Dashboard' },
    { id: 'JAY-AI Hub', icon: AiIcon, label: 'JAY-AI Hub' },
    { id: 'Schools', icon: SchoolIcon, label: 'Schools' },
    { id: 'Candidates', icon: UsersIcon, label: 'Candidates' },
    { id: 'Opportunities', icon: OpportunitiesIcon, label: 'Opportunities' },
    { id: 'Reports', icon: ReportIcon, label: 'Reports' },
    { id: 'Tasks, Notes & Emails', icon: TaskIcon, label: 'Tasks, Notes & Emails' },
    { id: 'Calls', icon: CallIcon, label: 'Call Logs' },
    { id: 'Dialer', icon: PhoneOutgoingIcon, label: 'Dialer' },
  ];
  
  const bookOfBusinessItem = { id: 'Book of Business', icon: DollarIcon, label: 'Book of Business' };
  const settingsNavItem = { id: 'Settings', icon: WorkflowIcon, label: 'Settings' };
  const qrCodeNavItem = { id: 'QrCode', icon: QrCodeIcon, label: 'Log in via mobile' };
  

  return (
    <aside className={`w-64 bg-slate-900 p-4 flex flex-col transition-transform duration-300 ease-in-out z-40
      fixed inset-y-0 left-0 md:relative md:translate-x-0
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
    >
      <div className="relative flex flex-col items-center mb-8 px-2">
        <button onClick={() => setIsOpen(false)} className="md:hidden p-1 absolute top-0 right-0">
            <CloseIcon className="w-6 h-6 text-slate-400" />
        </button>
        <div className="w-16 h-16 mb-2">
            <div style={{
                position: 'relative',
                width: '100%',
                height: 0,
                paddingTop: '100%',
                overflow: 'hidden',
                borderRadius: '8px',
            }}>
                <iframe
                    loading="lazy"
                    style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        top: 0,
                        left: 0,
                        border: 'none',
                        padding: 0,
                        margin: 0,
                    }}
                    src="https://www.canva.com/design/DAG4pIbFJNg/zuETWgjtmc_FUAOPVWbyRA/view?embed"
                ></iframe>
            </div>
        </div>
        <h1 className="text-sm font-bold text-white">EDUTALENT CONNECT</h1>
      </div>
      <nav className="flex-1 space-y-2">
        {mainNavItems.map((item) => (
          <NavItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            isActive={activeView === item.id}
            onClick={() => handleNavItemClick(item.id)}
          />
        ))}
      </nav>

      <div className="py-2 border-t border-slate-700/50">
          <NavItem
              key={bookOfBusinessItem.id}
              icon={bookOfBusinessItem.icon}
              label={bookOfBusinessItem.label}
              isActive={activeView === bookOfBusinessItem.id}
              onClick={() => handleNavItemClick(bookOfBusinessItem.id)}
          />
      </div>

      <div className="mt-auto">
        <div className="py-2 border-t border-slate-700/50">
            <NavItem
                key={qrCodeNavItem.id}
                icon={qrCodeNavItem.icon}
                label={qrCodeNavItem.label}
                isActive={false}
                onClick={handleQrCodeClick}
            />
            <NavItem
                key={settingsNavItem.id}
                icon={settingsNavItem.icon}
                label={settingsNavItem.label}
                isActive={activeView === settingsNavItem.id}
                onClick={() => handleNavItemClick(settingsNavItem.id)}
            />
        </div>
        <div className="p-3 mt-2">
            <div className="w-48 mx-auto">
                <div style={{
                    position: 'relative',
                    width: '100%',
                    height: 0,
                    paddingTop: '35%', // Aspect ratio for a wide logo
                    overflow: 'hidden',
                    borderRadius: '8px',
                }}>
                    <iframe
                        loading="lazy"
                        style={{
                            position: 'absolute',
                            width: '100%',
                            height: '100%',
                            top: 0,
                            left: 0,
                            border: 'none',
                            padding: 0,
                            margin: 0,
                        }}
                        src="https://www.canva.com/design/DAG4pEa3vB4/4Xsg-YnSYLibXa-N7WD7LQ/view?embed"
                    ></iframe>
                </div>
            </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;