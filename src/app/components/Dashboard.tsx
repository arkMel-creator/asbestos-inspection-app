import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Sample, Project, User } from '../types';
import { Map as MapIcon, Share2, ClipboardList, Briefcase, ChevronRight, Calendar as CalendarIcon, Bell, Clock, ChevronLeft, Settings, X, Search, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, isToday, addWeeks, subWeeks } from 'date-fns';

interface DashboardProps {
  samples: Sample[];
  projects: Project[];
  users: User[];
  currentUser: User;
  onNavigate: (view: string) => void;
  onOpenProject: (projectName: string) => void;
  onUpdateProject: (id: string, updates: Partial<Project>) => void;
}

export function Dashboard({ samples, projects, users, currentUser, onNavigate, onOpenProject, onUpdateProject }: DashboardProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [assigningProject, setAssigningProject] = useState<Project | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [visibleCategories, setVisibleCategories] = useState({
    jobs: true,
    quotes: true,
    recurring: true
  });

  // Filter projects assigned to the current user
  const myProjects = useMemo(() => {
    return projects.filter(p => p.manager === currentUser.name || p.manager === currentUser.username);
  }, [projects, currentUser]);

  // Calendar Event Logic
  const jobDeadlines = useMemo(() => {
    const deadlines: Record<string, Project[]> = {};
    projects.forEach(p => {
      if (p.dueDate) {
        const date = p.dueDate.split('T')[0];
        if (!deadlines[date]) deadlines[date] = [];
        deadlines[date].push(p);
      }
    });
    return deadlines;
  }, [projects]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
      u.role.toLowerCase().includes(userSearch.toLowerCase())
    );
  }, [users, userSearch]);

  const quickActions = [
    {
      title: 'Active Projects',
      description: 'View all ongoing inspection projects',
      icon: Briefcase,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      action: () => onNavigate('projects')
    },
    {
      title: 'Map View',
      description: 'Interactive map and site overlays',
      icon: MapIcon,
      color: 'bg-blue-50 text-blue-600 border-blue-100',
      action: () => onNavigate('map')
    },
    {
      title: 'Workspace',
      description: 'Manage samples and project files',
      icon: ClipboardList,
      color: 'bg-purple-50 text-purple-600 border-purple-100',
      action: () => onNavigate('workspace')
    },
    {
      title: 'Sharing',
      description: 'Manage external access links',
      icon: Share2,
      color: 'bg-amber-50 text-amber-600 border-amber-100',
      action: () => onNavigate('sharing')
    }
  ];

  // WorkflowMax Week View Logic
  const renderCalendar = () => {
    const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
    const endDate = endOfWeek(startDate, { weekStartsOn: 1 });
    const weekDays = [];
    let day = startDate;

    while (day <= endDate) {
      weekDays.push(day);
      day = addDays(day, 1);
    }

    const weekTitle = `${format(startDate, 'MMM d')} – ${format(endDate, 'd, yyyy')}`;

    return (
      <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="flex items-center border rounded-lg overflow-hidden border-slate-300">
                <Button variant="ghost" size="icon" className="h-9 w-9 border-r border-slate-300 rounded-none hover:bg-slate-50" onClick={() => setCurrentDate(subWeeks(currentDate, 1))}>
                  <ChevronLeft className="h-4 w-4 text-slate-600" />
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-none hover:bg-slate-50" onClick={() => setCurrentDate(addWeeks(currentDate, 1))}>
                  <ChevronRight className="h-4 w-4 text-slate-600" />
                </Button>
              </div>
            </div>
            <h2 className="text-xl font-semibold text-slate-900">{weekTitle}</h2>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <div className="flex items-center gap-1.5 opacity-100 transition-opacity" style={{ opacity: visibleCategories.jobs ? 1 : 0.4 }}>
                <input type="checkbox" checked={visibleCategories.jobs} onChange={() => setVisibleCategories(v => ({...v, jobs: !v.jobs}))} className="w-4 h-4 rounded border-slate-300 text-emerald-500 cursor-pointer" />
                <span className="px-2 py-1 rounded bg-[#99f6e0] text-[#107569]">Jobs</span>
              </div>
              <div className="flex items-center gap-1.5 opacity-100 transition-opacity" style={{ opacity: visibleCategories.quotes ? 1 : 0.4 }}>
                <input type="checkbox" checked={visibleCategories.quotes} onChange={() => setVisibleCategories(v => ({...v, quotes: !v.quotes}))} className="w-4 h-4 rounded border-slate-300 text-amber-500 cursor-pointer" />
                <span className="px-2 py-1 rounded bg-[#ffd6ae] text-[#bc1b06]">Quotes</span>
              </div>
              <div className="flex items-center gap-1.5 opacity-100 transition-opacity" style={{ opacity: visibleCategories.recurring ? 1 : 0.4 }}>
                <input type="checkbox" checked={visibleCategories.recurring} onChange={() => setVisibleCategories(v => ({...v, recurring: !v.recurring}))} className="w-4 h-4 rounded border-slate-300 text-teal-500 cursor-pointer" />
                <span className="px-2 py-1 rounded bg-[#99f6e0] text-[#107569] opacity-70">Recurring Jobs</span>
              </div>
            </div>
            <Button 
              variant={showSettings ? "secondary" : "outline"} 
              size="icon" 
              className={`h-9 w-9 border-slate-300 ${showSettings ? 'bg-slate-100' : 'text-slate-500'}`}
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {showSettings && (
          <div className="bg-slate-50 border-b border-slate-200 p-4 animate-in slide-in-from-top duration-200">
            <h3 className="text-sm font-bold text-slate-700 mb-3">Calendar Options</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-white transition-colors">
                <input type="checkbox" checked={visibleCategories.jobs} onChange={() => setVisibleCategories(v => ({...v, jobs: !v.jobs}))} className="w-4 h-4 rounded border-slate-300 text-emerald-500" />
                <span className="text-xs font-medium text-slate-600">Show Project Deadlines</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-white transition-colors">
                <input type="checkbox" checked={visibleCategories.quotes} onChange={() => setVisibleCategories(v => ({...v, quotes: !v.quotes}))} className="w-4 h-4 rounded border-slate-300 text-emerald-500" />
                <span className="text-xs font-medium text-slate-600">Show Quotes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-white transition-colors">
                <input type="checkbox" checked={visibleCategories.recurring} onChange={() => setVisibleCategories(v => ({...v, recurring: !v.recurring}))} className="w-4 h-4 rounded border-slate-300 text-emerald-500" />
                <span className="text-xs font-medium text-slate-600">Show Recurring Jobs</span>
              </label>
            </div>
          </div>
        )}

        <div className="grid grid-cols-7 border-b border-slate-200 bg-white">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((dayName, idx) => {
            const currentDay = weekDays[idx];
            const isTodayDay = isToday(currentDay);
            return (
              <div key={dayName} className={`px-4 py-3 text-sm font-medium border-r border-slate-100 last:border-r-0 text-center ${isTodayDay ? 'text-slate-900 bg-slate-50/50' : 'text-slate-500'}`}>
                {dayName}
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-7 h-[460px] bg-white divide-x divide-slate-100">
          {weekDays.map((day, idx) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const projectsOnDay = jobDeadlines[dateKey] || [];
            const isTodayDay = isToday(day);
            
            return (
              <div key={idx} className={`relative flex flex-col group ${isTodayDay ? 'bg-slate-50/30' : ''}`}>
                <div className="p-3 text-right">
                  <span className={`text-sm font-semibold ${isTodayDay ? 'text-blue-600' : 'text-slate-400'}`}>
                    {format(day, 'd')}
                  </span>
                </div>
                <div className="flex-1 px-2 space-y-1">
                  {visibleCategories.jobs && projectsOnDay.map((p, pIdx) => (
                    <div 
                      key={pIdx} 
                      className="text-[11px] font-bold px-2 py-1.5 rounded-[4px] bg-[#99f6e0] text-[#107569] border border-transparent hover:border-[#107569]/20 cursor-pointer shadow-sm truncate"
                      onClick={() => onOpenProject(p.name)}
                    >
                      {p.name}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-8">
      {/* Quick Actions Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {quickActions.map((action) => (
          <Card 
            key={action.title} 
            className="group cursor-pointer hover:shadow-md transition-all border-slate-200"
            onClick={action.action}
          >
            <CardContent className="p-5 flex items-start gap-4">
              <div className={`p-3 rounded-xl border transition-colors ${action.color} group-hover:bg-opacity-80`}>
                <action.icon className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-slate-900 leading-none">{action.title}</h4>
                <p className="text-xs text-slate-500 leading-tight">{action.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Grid: My Projects (Full Width after Task removal) */}
      <div className="grid grid-cols-1 gap-8">
        {/* My Projects (WorkflowMax Style) */}
        <Card className="border-slate-200 shadow-sm overflow-hidden min-h-[395px]">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-white py-5 px-6">
            <CardTitle className="text-lg font-bold text-slate-900">My Projects</CardTitle>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex overflow-hidden rounded-lg border border-slate-300 divide-x divide-slate-300">
                <button className="px-4 py-2 text-xs font-bold uppercase bg-white text-slate-600">Upcoming <span className="ml-2 px-2 py-0.5 rounded-full bg-[#f0f9ff] text-[#026aa2] border border-[#b9e6fe]">0</span></button>
                <button className="px-4 py-2 text-xs font-bold uppercase bg-slate-100 text-slate-600">In Progress <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">{myProjects.length}</span></button>
                <button className="px-4 py-2 text-xs font-bold uppercase bg-white text-slate-600">Overdue <span className="ml-2 px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">0</span></button>
              </div>
              <Button variant="outline" size="sm" className="h-9 border-slate-200 text-slate-600 text-[11px] font-bold uppercase" onClick={() => onNavigate('projects')}>
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-y-auto max-h-[314px]">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-100 z-10">
                <tr>
                  <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase">Job No.</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase">Job Name / Site</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase">Client</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase">Assigned To</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-slate-50/80 transition-colors group cursor-pointer" onClick={() => onOpenProject(project.name)}>
                    <td className="px-6 py-4 text-sm font-bold text-emerald-700 hover:underline">{project.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <div className="line-clamp-1">{project.site}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-emerald-700 hover:underline">{project.client}</td>
                    <td className="px-6 py-4">
                      <div 
                        className="flex items-center gap-2 group/assign p-1 rounded hover:bg-slate-100 transition-colors"
                        onClick={(e) => { e.stopPropagation(); setAssigningProject(project); }}
                      >
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 border border-slate-200">
                          {project.manager.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm text-slate-600 group-hover/assign:text-blue-600 transition-colors">{project.manager}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {project.dueDate ? format(new Date(project.dueDate), 'dd MMM yyyy') : '-'}
                    </td>
                  </tr>
                ))}
                {myProjects.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-sm text-slate-400 italic">No projects assigned to you.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* Full Width Exact Calendar */}
      <div className="relative">
        {renderCalendar()}
      </div>

      {/* Assignment Modal */}
      {assigningProject && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <Card className="w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50 py-4">
              <CardTitle className="text-lg">Assign Project</CardTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setAssigningProject(null)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-3 border-b">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="Search people..." 
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-9 h-9"
                    autoFocus
                  />
                </div>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors text-left border-b border-slate-50 last:border-0"
                    onClick={() => {
                      onUpdateProject(assigningProject.id, { manager: user.name });
                      setAssigningProject(null);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                        {user.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                        <p className="text-[11px] text-slate-500 capitalize">{user.role}</p>
                      </div>
                    </div>
                    {assigningProject.manager === user.name && <Check className="h-4 w-4 text-blue-600" />}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
