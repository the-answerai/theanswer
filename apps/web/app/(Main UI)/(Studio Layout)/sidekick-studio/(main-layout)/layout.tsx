import MainLayout from 'flowise-ui/src/layout/MainLayout'

const StudioLayout = ({ children }: { children: React.ReactNode }) => {
    return <MainLayout>{children as any}</MainLayout>
}

export default StudioLayout
