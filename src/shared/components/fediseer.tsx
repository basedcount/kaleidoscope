const Fediseer = ({ actor_id }: { actor_id: string }) => {
  const site = new URL(actor_id).host;
  const key = localStorage.getItem('FEDISEER_KEY');

  return (
    <div className="card border-secondary mb-3">
      <div className="card-body">
        <h2 className="h5">Fediseer</h2>
        <div class="mb-3" style="display: grid; 	grid-template-columns: repeat(3, minmax(0, 1fr));">
          <p style="grid-column: span 3 / span 3;">Fediseer actions for the <span class="font-monospace">{site}</span> instance.</p>
          <img src={`https://fediseer.com/api/v1/badges/guarantees/${site}.svg`} alt="guarantor" class="me-4" />
          <img src={`https://fediseer.com/api/v1/badges/endorsements/${site}.com.svg`} alt="endorsements" />
        </div>

        {key !== null ? (
          <>
            <div class="d-flex flex-row column-gap-3">
              <button type="button" class="btn btn-outline-success">Endorse</button>
              <button type="button" class="btn btn-outline-warning">Hesitate</button>
              <button type="button" class="btn btn-outline-danger">Censor</button>
            </div>
            <div class="d-flex flex-row column-gap-1 mt-3">
              <input class="form-control" id="fediseer-reason" type="text" placeholder="Reason (optional)" />
              <button type="button" class="btn btn-primary">Confirm</button>
            </div>
          </>
        ) : (
          <i>Actions are not available because no API key has been set. <br /> You can set a Fediseer API key from the "Fediseer" section of your <a href="/settings">user settings</a>.</i>
        )}
      </div>
    </div >
  );
}

export default Fediseer;