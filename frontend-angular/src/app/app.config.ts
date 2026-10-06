import { ApplicationConfig } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';
import { LUCIDE_ICONS, LucideIconProvider } from 'lucide-angular';
import { 
  LayoutDashboard, Users, UserCheck, Bell, Gavel, UsersRound, Briefcase, 
  ClipboardEdit, ShoppingCart, Calculator, FileSignature, PackageCheck, 
  Wallet, Receipt, FileText, Banknote, PiggyBank, Settings2, ArrowLeftRight, 
  FileBox, Plane, FilePlus, BarChart3, TrendingUp, Building2, SlidersHorizontal, 
  ListChecks, ScrollText, Shield, KeyRound, ShieldCheck, ChevronDown, ChevronRight, 
  LogOut, Menu, CalendarDays, Edit, Trash2, Plus, Search, X, Eye, Check, 
  AlertTriangle, Info, FileUp, Download, ArrowLeft, CheckCircle, AlertCircle,
  ClipboardList, Package, CreditCard, CircleDollarSign, User, Lock,
  PieChart, FileSpreadsheet, GitCommit, Scale, ZoomIn, ListTree, CalendarCheck, ShieldAlert,
  Send, RotateCw, Database, CheckCircle2, Clock, Pencil
} from 'lucide-angular';

const icons = {
  LayoutDashboard, Users, UserCheck, Bell, Gavel, UsersRound, Briefcase, 
  ClipboardEdit, ShoppingCart, Calculator, FileSignature, PackageCheck, 
  Wallet, Receipt, FileText, Banknote, PiggyBank, Settings2, ArrowLeftRight, 
  FileBox, Plane, FilePlus, BarChart3, TrendingUp, Building2, SlidersHorizontal, 
  ListChecks, ScrollText, Shield, KeyRound, ShieldCheck, ChevronDown, ChevronRight, 
  LogOut, Menu, CalendarDays, Edit, Trash2, Plus, Search, X, Eye, Check, 
  AlertTriangle, Info, FileUp, Download, ArrowLeft, CheckCircle, AlertCircle,
  ClipboardList, Package, CreditCard, CircleDollarSign, User, Lock,
  PieChart, FileSpreadsheet, GitCommit, Scale, ZoomIn, ListTree, CalendarCheck, ShieldAlert,
  Send, RotateCw, Database, CheckCircle2, Clock, Pencil
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(),
    provideAnimations(),
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider(icons)
    }
  ]
};
