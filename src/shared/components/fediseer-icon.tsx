import { Component } from "inferno";

interface IconProp {
  instance: string;
  fediseer: null | { endorsements: string[], hesitations: string[], censures: string[] };
}

export class FediseerIcon extends Component<IconProp, any> {
  constructor(props: any, context: any) {
    super(props, context);
  }

  render() {
    const fediseer = this.props.fediseer;
    const domain = new URL(this.props.instance).host;

    if (fediseer === null) return (<></>); //Fediseer disabled

    if (fediseer.endorsements.includes(domain)) { //Endorsed
      const tooltip = "Fediseer - approved instance";

      return (
        <span class="ms-1 d-flex flex-row text-success align-items-center gap-1" aria-label={tooltip} data-tippy-content={tooltip}>
          <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 512 512" style="fill: var(--bs-success); vertical-align: middle;" aria-label={tooltip} data-tippy-content={tooltip}>
            <path d="M104 224H24c-13.255 0-24 10.745-24 24v240c0 13.255 10.745 24 24 24h80c13.255 0 24-10.745 24-24V248c0-13.255-10.745-24-24-24zM64 472c-13.255 0-24-10.745-24-24s10.745-24 24-24 24 10.745 24 24-10.745 24-24 24zM384 81.452c0 42.416-25.97 66.208-33.277 94.548h101.723c33.397 0 59.397 27.746 59.553 58.098.084 17.938-7.546 37.249-19.439 49.197l-.11.11c9.836 23.337 8.237 56.037-9.308 79.469 8.681 25.895-.069 57.704-16.382 74.757 4.298 17.598 2.244 32.575-6.148 44.632C440.202 511.587 389.616 512 346.839 512l-2.845-.001c-48.287-.017-87.806-17.598-119.56-31.725-15.957-7.099-36.821-15.887-52.651-16.178-6.54-.12-11.783-5.457-11.783-11.998v-213.77c0-3.2 1.282-6.271 3.558-8.521 39.614-39.144 56.648-80.587 89.117-113.111 14.804-14.832 20.188-37.236 25.393-58.902C282.515 39.293 291.817 0 312 0c24 0 72 8 72 81.452z" />
          </svg>
          {/* Endorsed */}
        </span>
      )
    }

    if (fediseer.hesitations.includes(domain)) {  //Hesitated
      const tooltip = "Fediseer - hesitated instance";

      return (
       <span class="ms-1 d-flex flex-row text-warning align-items-center gap-1" aria-label={tooltip} data-tippy-content={tooltip}>
          <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="-10 0 587 512" style="fill: var(--bs-warning); vertical-align: middle;">
             <path d="M569.517 440.013C587.975 472.007 564.806 512 527.94 512H48.054c-36.937 0-59.999-40.055-41.577-71.987L246.423 23.985c18.467-32.009 64.72-31.951 83.154 0l239.94 416.028zM288 354c-25.405 0-46 20.595-46 46s20.595 46 46 46 46-20.595 46-46-20.595-46-46-46zm-43.673-165.346l7.418 136c.347 6.364 5.609 11.346 11.982 11.346h48.546c6.373 0 11.635-4.982 11.982-11.346l7.418-136c.375-6.874-5.098-12.654-11.982-12.654h-63.383c-6.884 0-12.356 5.78-11.981 12.654z"/>
          </svg>
          {/* Hesitated */}
        </span>
      )
    }

    if (fediseer.censures.includes(domain)) { //Censured
      const tooltip = "Fediseer - censured instance";

      return (
        <span class="ms-1 d-flex flex-row text-danger align-items-center gap-1" aria-label={tooltip} data-tippy-content={tooltip}>
          <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 512 512" style="fill: var(--bs-danger); vertical-align: middle;">
            <path d="M367.2 412.5L99.5 144.8C77.1 176.1 64 214.5 64 256c0 106 86 192 192 192c41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3C434.9 335.9 448 297.5 448 256c0-106-86-192-192-192c-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256z" />
          </svg>
          {/* Censured */}
        </span>
      )
    }

    return (<></>); //Unknown (no Fediseer preference set)
  }
};