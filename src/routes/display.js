import Console from "@/display/settings/Console";
import Dashboard from "@/display/Dashboard";
import Files from "@/display/Files";
import Heightmap from "@/display/settings/Heightmap";
import QuickSettings from "@/display/settings/QuickSettings";
import Services from "@/display/settings/Services";
import Settings from "@/display/Settings";
import Status from "@/display/Status";

const routes = [
    {
        path: '/display',
        redirect: '/display/dashboard',
        name: 'Home',
        hidden: true,
        component: {
            template: '<router-view/>',
        },
    },
    {
        name: 'dashboard',
        title: "Dashboard",
        path: '/display/dashboard',
        icon: 'view-dashboard-variant',
        iconActive: 'view-dashboard-variant-outline',
        component: Dashboard,
        hidden: false,
        alwaysShow: true,
    },
    {
        name: 'status',
        title: "Status",
        path: '/display/status',
        icon: 'printer-3d-nozzle',
        component: Status,
        alwaysShow: true,
        hidden: false,
    },
    {
        title: "Files",
        path: '/display/files',
        icon: 'folder',
        iconActive: 'folder-open',
        component: Files,
        alwaysShow: true,
    },
    {
        name: 'settings',
        title: "Settings",
        path: '/display/settings',
        icon: 'cog',
        iconActive: 'cogs',
        component: Settings,
        alwaysShow: false,
        children: [
            {
                path: '',
                component: QuickSettings,
                alwaysShow: false,
                hidden: true,
            },
            {
                title: 'Bed Mesh',
                path: '/display/settings/heightmap',
                icon: 'grid',
                component: Heightmap,
                alwaysShow: true,
            },
            {
                title: 'Console',
                path: '/display/settings/console',
                icon: 'console-line',
                component: Console,
                alwaysShow: true,
            },
            {
                title: 'Services',
                path: '/display/settings/services',
                icon: 'widgets',
                component: Services,
                alwaysShow: true,
            },
        ]
    },
];

export default routes;