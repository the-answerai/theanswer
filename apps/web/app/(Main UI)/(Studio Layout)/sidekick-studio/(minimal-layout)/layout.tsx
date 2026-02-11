import MinimalLayout from 'flowise-ui/src/layout/MinimalLayout'

const StudioLayout = ({ children }: { children: React.ReactNode }) => {
    return <MinimalLayout>{children as any}</MinimalLayout>
}

export default StudioLayout
