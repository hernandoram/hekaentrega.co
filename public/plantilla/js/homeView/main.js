

'use strict'

const inicio = function(){
    function bienvenida(text) {
        return React.createElement(
            "h1", null, text
        )
    }
        
    
    const domContainer = document.getElementById('home');
    
    ReactDOM.render(bienvenida("This is my home page"), domContainer);
}

export default inicio;