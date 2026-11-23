export const FormBottomBarWrapper = ({ children }: any) => {
    return(
        <div className={`absolute bottom-4 bg-white py-4 flex items-center justify-between z-10 w-[80vw] border-t border-gray-200`}>
            {children}
        </div>
    )
}