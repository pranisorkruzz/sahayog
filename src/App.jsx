import './App.css'


function App() {
  return (
    <div>
    <header>
    <div className="nav-bar">
        <div className="nav-logo">
            <div className="logo">
            </div>
        </div>
        <span className="nav-browse">Browse campaigns</span>
        <span className="nav-how">How it works</span>
        <span className="login-btn">Login</span>
        
        </div>
        </header>
        <div className="main-content">
          <div className="browse-help">
          <div className='title' style={{margin:'20px' , fontWeight:'bolder'}}>
          <h1>Sahayog for healing,</h1>
          <h1>Sahayog for hope.</h1>
          </div>
          <div className='title-content'><p>Connect with caring communities to fund critical medical treatments, surgeries, and healthcare needs. Every contribution makes a difference in someone's healing journey.
          </p></div>
          <div className="start-btn">
            <button>Start a Medical Campaign</button>
          <span className="main-browse">Browse Help Requests</span>

          </div>
        </div>
        
        </div>
        <div className="how">
          <h2>How Sahayog Works</h2>
          <p>Simple steps to get medical help or support others</p>
        </div>
        <footer>
          <div className="footers">
            <div className="footer-section">
            <h2 style={{fontWeight:'bold', marginLeft:'15px'}}>MedHelp</h2>
            <ul>
              <li><a href='#'>Connecting patients with caring communities to fund critical medical treatments and healthcare needs.</a></li>

            </ul>
            </div>
            <div className="footer-section">
            <h2 style={{fontWeight:'bold'}}>Quick links</h2>
            <ul>
              <li><a href='#'>How it works</a></li>
              <li><a href='#'>Sucess stories</a></li>
              <li><a href='#'>Medical categories</a></li>
              <li><a href='#'>Start a campaigns</a></li>

            </ul>
            </div>
            <div className="footer-section">
            <h2 style={{fontWeight:'bold'}}>Support</h2>
            <ul>
              <li><a href='#'>Help Center</a></li>
              <li><a href='#'>Contact Us</a></li>
              <li><a href='#'>Safety Guidelines</a></li>
              <li><a href='#'>Report a Campaign</a></li>

            </ul>
            </div>
            <div className="footer-section">
            <h2 style={{fontWeight:'bold'}}>Legal</h2>
            <ul>
              <li><a href='#'>How it works</a></li>
              <li><a href='#'>Sucess stories</a></li>
              <li><a href='#'>Medical categories</a></li>
              <li><a href='#'>Start a campaigns</a></li>

            </ul>
            </div>
            
          </div>
        </footer>
        </div>
        
  )
}

export default App