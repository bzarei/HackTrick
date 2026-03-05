export const applicationConfig = {
    deployment: "microfrontend", // microfrontend local service
    deployments: {
        local: {},
        service: {},
        microfrontend: {
            remotes: [
                { name: 'microfrontend', url: 'http://localhost:3001' }
            ]
        }
    },
    server: {
        url: 'http://localhost:8000/'
    }
}