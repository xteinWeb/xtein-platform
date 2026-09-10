{
  applicationId:
    __APPLICATION_CLASS_PREFIX__Application.Id,

  load:
    async (): Promise<
      Type<unknown>
    > => {

      const applicationModule =
        await import(
          './__APPLICATION_FILE_PREFIX__/__APPLICATION_FILE_PREFIX__.component'
        );


      return applicationModule
        .__APPLICATION_CLASS_PREFIX__Component;
    }
}
