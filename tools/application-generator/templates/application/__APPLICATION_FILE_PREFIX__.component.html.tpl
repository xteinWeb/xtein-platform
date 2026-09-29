<section class="__APPLICATION_FILE_PREFIX__">
  <p class="__APPLICATION_FILE_PREFIX____description">
    __APPLICATION_DESCRIPTION__
  </p>
</section>

<xtein-record-settings
  [visible]="settingsVisible()"
  (visibleChange)="settingsVisible.set($event)"
  [applicationId]="applicationId"
/>
