import loginSideImage from '../../assets/images/loginSide.png'

export const RightSidePanel = () => {
    return (
        <>
            <div className="hidden lg:block relative w-0 flex-1 h-[97vh] m-3">
                <div className="absolute inset-0 rounded-lg overflow-hidden">
                    <img
                        src={loginSideImage}
                        className="h-full w-full object-cover object-left absolute inset-0 z-0"
                        alt="Login Background"
                    />

                    <div className="relative z-10 flex flex-col items-start justify-start h-full text-white p-20 pr-10">
                        <div className="max-w-lg pt-10 ps-10">
                            <h1 className="text-3xl font-bold mb-4">
                                Effortlessly manage your society and operations
                            </h1>
                            <p className="text-sm opacity-90 mb-8">
                                Login to access your Dashboard and manage your society
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}