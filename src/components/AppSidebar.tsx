import { BarChart3, TrendingUp, Building2, Rocket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

const models = [
  {
    id: '3-statement',
    name: '3-Statement Model',
    icon: BarChart3,
  },
  {
    id: 'startup',
    name: 'Startup Model',
    icon: Rocket,
  },
];

interface DashboardTab {
  value: string;
  label: string;
  icon: React.ElementType;
}

interface AppSidebarProps {
  selectedModel: string | null;
  onModelSelect: (modelId: string) => void;
  tabs?: DashboardTab[];
  activeTab?: string;
  onTabSelect?: (tabValue: string) => void;
}

export function AppSidebar({ selectedModel, onModelSelect, tabs, activeTab, onTabSelect }: AppSidebarProps) {
  const navigate = useNavigate();
  
  const handleModelSelect = (modelId: string) => {
    onModelSelect(modelId);
    navigate(`/model/${modelId}`);
  };
  
  return (
    <Sidebar className="w-64 border-r border-sidebar-border">
      <SidebarContent className="bg-sidebar pt-16">
        <SidebarGroup className="px-0 pt-6">
          <SidebarGroupLabel className="px-6 py-4 text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wider">
            Financial Models
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-3 pb-2">
            <SidebarMenu>
              {models.map((model) => {
                const IconComponent = model.icon;
                const isActive = selectedModel === model.id;
                
                return (
                  <SidebarMenuItem key={model.id}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => handleModelSelect(model.id)}
                      className={`w-full justify-start px-4 py-3 mx-1 mb-2 rounded-xl transition-all duration-200 ${
                        isActive 
                          ? 'bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/25 ring-2 ring-primary/20' 
                          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:shadow-md hover:scale-[1.02]'
                      }`}
                    >
                      <IconComponent className={`h-4 w-4 mr-3 ${isActive ? 'text-black font-bold' : 'text-sidebar-foreground/70'}`} />
                      <span className="text-sm">{model.name}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Dashboard Tabs (only show if tabs are provided) */}
        {tabs && tabs.length > 0 && (
          <div className="mt-2 px-3">
          <SidebarGroup>
              <SidebarGroupLabel className="px-3 py-2 text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wider">
                Dashboard Sections
            </SidebarGroupLabel>
            <SidebarGroupContent className="px-0 pb-2">
              <SidebarMenu>
                  {tabs.map((tab) => {
                    const IconComponent = tab.icon;
                    const isActive = activeTab === tab.value;
                    return (
                      <SidebarMenuItem key={tab.value}>
                        <SidebarMenuButton
                          isActive={isActive}
                          onClick={() => onTabSelect && onTabSelect(tab.value)}
                          className={`w-full justify-start px-4 py-3 mx-1 mb-2 rounded-xl transition-all duration-200 ${
                            isActive
                              ? 'bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/25 ring-2 ring-primary/20'
                              : 'text-sidebar-foreground hover:bg-sidebar-accent hover:shadow-md hover:scale-[1.02]'
                          }`}
                        >
                          <IconComponent className={`h-4 w-4 mr-3 ${isActive ? 'text-black font-bold' : 'text-sidebar-foreground/70'}`} />
                          <span className="text-sm">{tab.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                    );
                  })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>
        )}

      </SidebarContent>
    </Sidebar>
  );
}