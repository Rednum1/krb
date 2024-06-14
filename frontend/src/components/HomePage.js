import React from 'react';

const HomePage = () => {
    const styles = {
        centeredContainer: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
        },
    };

    return (
        <div style={styles.centeredContainer}>
            <h1>Welcome to the Encryption App</h1>
       
        </div>
    );
};

export default HomePage;
