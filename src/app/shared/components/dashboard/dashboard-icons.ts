// dashboard-icons.ts
import * as Dashboard from 'devexpress-dashboard';

const svgInfo = `
<svg id="iconInfo" xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" fill="#2196F3"/>
    <rect x="11" y="10" width="2" height="7" rx="1" fill="white"/>
    <circle cx="12" cy="7" r="1.3" fill="white"/>
</svg>`;

const svgRoles = `
<svg id="iconRoles" xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 24 24">
    <path fill="#FF9800"
          d="M17 8h-1V6a4 4 0 10-8 0v2H7a2 2 0 00-2 2v8a2 2 0 002 2h10a2 2 0 002-2v-8a2 2 0 00-2-2zm-7-2a2 2 0 114 0v2h-4V6zm3 8.73V17h-2v-2.27a2 2 0 112 0z"/>
</svg>`;

const svgSettings = `
<svg id="iconSettings" xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 24 24">
  <path fill="#757575"
    d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 00.12-.64l-1.92-3.32a.5.5 0 00-.61-.22l-2.39.96a7.2 7.2 0 00-1.63-.94l-.36-2.54A.5.5 0 0013.89 2h-3.78a.5.5 0 00-.49.42L9.26 4.96c-.58.22-1.13.53-1.63.94l-2.39-.96a.5.5 0 00-.61.22L2.71 8.48a.5.5 0 00.12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.5.5 0 00-.12.64l1.92 3.32a.5.5 0 00.61.22l2.39-.96c.5.41 1.05.72 1.63.94l.36 2.54a.5.5 0 00.49.42h3.78a.5.5 0 00.49-.42l.36-2.54c.58-.22 1.13-.53 1.63-.94l2.39.96a.5.5 0 00.61-.22l1.92-3.32a.5.5 0 00-.12-.64l-2.03-1.58zM12 15.5A3.5 3.5 0 1112 8.5a3.5 3.5 0 010 7z"/>
</svg>`;

export const svgKpiSettings = `
<svg id="iconKpiSettings"
     xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 24 24">

    <style>
        .dx-dashboard-icon {
            fill: currentColor;
        }
    </style>

    <!-- Barras -->
    <rect class="dx-dashboard-icon" x="3" y="13" width="3" height="8" rx="0.5"/>
    <rect class="dx-dashboard-icon" x="8" y="9" width="3" height="12" rx="0.5"/>
    <rect class="dx-dashboard-icon" x="13" y="5" width="3" height="16" rx="0.5"/>

    <!-- Engranaje -->
    <g transform="translate(17,6)">
        <circle class="dx-dashboard-icon" cx="3" cy="3" r="1.6"/>
        <path class="dx-dashboard-icon"
              d="M3 0.2l0.5 0.2 0.4-0.4 0.8 0.5-0.2 0.5
                 0.5 0.5 0.6-0.1 0.3 0.9-0.5 0.3v0.7l0.5 0.3
                 -0.3 0.9-0.6-0.1-0.5 0.5 0.2 0.5-0.8 0.5
                 -0.4-0.4-0.5 0.2-0.2 0.5h-1l-0.2-0.5-0.5-0.2
                 -0.4 0.4-0.8-0.5 0.2-0.5-0.5-0.5-0.6 0.1
                 -0.3-0.9 0.5-0.3v-0.7l-0.5-0.3 0.3-0.9
                 0.6 0.1 0.5-0.5-0.2-0.5 0.8-0.5
                 0.4 0.4 0.5-0.2L3 0.2z"/>
    </g>
</svg>`;

Dashboard.ResourceManager.registerIcon(svgInfo);
Dashboard.ResourceManager.registerIcon(svgRoles);
Dashboard.ResourceManager.registerIcon(svgSettings);
Dashboard.ResourceManager.registerIcon(svgKpiSettings);