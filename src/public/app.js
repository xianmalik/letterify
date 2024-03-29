import Select from 'react-select';
import chroma from 'chroma-js';
import TextToImage from './utils/TextToImage';

const fonts_fallback = require( '../configs/fonts.json' );
const colors_fallback = require( '../configs/colors.json' );

const dot = ( color = '#ccc' ) => ( {
	alignItems: 'center',
	display: 'flex',
	':before': {
		backgroundColor: color,
		borderRadius: 3,
		content: '" "',
		display: 'block',
		marginRight: 8,
		height: 16,
		width: 16,
		border: '1px solid #f2f2f2',
	},
} );

const fontsStyles = {
	control: styles => ( { ...styles } ),
	option: ( styles, { data } ) => {
		return { ...styles, fontFamily: data.value };
	},
	input: ( styles, { data } ) => {
		return { ...styles, fontFamily: data.value };
	},
	placeholder: styles => ( { ...styles } ),
	singleValue: styles => ( { ...styles } ),
};

const colourStyles = {
	control: styles => ( { ...styles, backgroundColor: 'white' } ),
	option: ( styles, { data, isDisabled, isSelected } ) => {
		const color = chroma( data.value );
		return {
			...styles,
			// backgroundColor: isDisabled ? null : isSelected ? data.color : isFocused ? color.alpha( 0.1 ).css() : null,
			// color: isDisabled ? '#ccc' : isSelected ? chroma.contrast( color, 'white' ) > 2 ? 'white' : 'black' : data.color,
			cursor: isDisabled ? 'not-allowed' : 'default',
			':active': {
				...styles[':active'],
				backgroundColor: ! isDisabled && ( isSelected ? data.value : color.alpha( 0.3 ).css() ),
			},
			...dot( color.css() ),
		};
	},
	input: styles => ( { ...styles, ...dot() } ),
	placeholder: styles => ( { ...styles, ...dot() } ),
	singleValue: ( styles, { data } ) => ( { ...styles, ...dot( data.value ) } ),
};

class LetterifyEl extends React.Component {
	constructor( props ) {
		super( props );
		const colors_data = JSON.parse( props.colors );
		let font_parsed, settings_parsed;
		try {
			font_parsed = JSON.parse( props.fonts );
		} catch {
			font_parsed = fonts_fallback;
		}
		try {
			settings_parsed = JSON.parse( props.settings );
			settings_parsed = settings_parsed !== null ? settings_parsed : {};
		} catch {
			settings_parsed = {};
		}

		this.state = {
			form_data: {
				value: '',
				connect: '',
				font: 'Almibar',
				color: settings_parsed.color || '#343234',
			},
			fields_data: [],
			height: '',
			width: 0,
			finish: settings_parsed.finish || '',
			colors: ( props.colors !== '' && Array.isArray( colors_data ) ) ? colors_data : colors_fallback,
			fonts: font_parsed,
			quantity: 1,
			loaded: false,
			price: 0,
			mounting: '',
			add_to_cart_text: 'Add to cart',
			added_to_cart: false,
			settings: settings_parsed,
		};
	}

	componentDidUpdate( ) { }

	componentDidMount( ) {
		fetch( letterify_admin_var.rest_api )
			.then( res => res.json() )
			.then( res => {
				this.setState( { loaded: true, fields_data: res } );
			}, error => {
				this.setState( { loaded: true, error } );
			} );
	}

	callbackWidth = ( v ) => {
		// const { height } = this.state;
		// const width = Number( v ) * Number( height );
		// this.handleChange( { target: { name: 'width', value: width } } );
	}

	handleChange = ( e ) => {
		const { name, value } = e.target;
		let new_data = this.state.form_data;
		new_data[name] = value;
		this.setState( { form_data: new_data } );
	}

	handleSubmit = ( e ) => {
		e.preventDefault();
		if ( this.state.added_to_cart ) {
			window.location = letterify_admin_var.cart_url;
			return;
		}

		this.setState( { loading: true } );

		var image = document.getElementById( 'canvasComponent' );
		var imageURL = image.toDataURL( 'image/png' );

		const { value } = this.state.form_data;
		const { base_price } = this.props;

		var data = {
			action: 'woocommerce_ajax_add_to_cart',
			price: ( base_price * ( value.replace( /\s/g, '' ).length > 0 ? value.replace( /\s/g, '' ).length : 1 ) ).toFixed( 2 ),
			quantity: this.state.quantity,
			// variation_id: null,
			imgBase64: imageURL,
			// finish: this.state.finish,
			// height: this.state.height,
			// thickness: this.state.thickness,
			// mounting: this.state.mounting,
			// width: this.state.width,
			data: this.state.form_data,
		};

		jQuery.ajax( {
			type: 'post',
			url: wc_add_to_cart_params.ajax_url,
			data: data,
			beforeSend: () => {
				this.setState( { add_to_cart_text: 'Adding to cart' } );
			},
			complete: () => {
				setTimeout( ( ) => {
					this.setState( { loading: false } );
				}, 1000 );
			},
			success: ( response ) => {
				if ( ! response.error ) {
					this.setState( { add_to_cart_text: 'View Cart', added_to_cart: true } );
				}
			},
			error: () => {
				this.setState( { add_to_cart_text: 'Unsuccessful' } );
				setTimeout( () => {
					this.setState( { add_to_cart_text: 'Add to cart' } );
				}, 1000 );
			},
		} );
	}

	render() {
		const parent = this;
		const { state } = parent;
		const { base_price } = this.props;

		if ( ! state.loaded ) {
			return <><h4>Loading</h4></>;
		}

		return (
			<>
				<form>
					<div className="xm-input-wrap text-center">
						{ React.createElement( () => {
							return (
								<TextToImage
									font={ state.form_data.font }
									color={ state.form_data.color }
									connect={ state.connect }
									callbackWidth={ this.callbackWidth }
									value={ state.form_data.value || '' }
									x="0" y="10" />
							);
						} ) }
					</div>
					<div className="xm-input-wrap">
						<input
							name='value'
							className="xm-entry-text"
							value={ state.form_data.value }
							onChange={ this.handleChange }
							placeholder={ 'Enter your text' } />
					</div>
					<div className="xm-input-wrap">
						<label htmlFor="font" className="text-right"><strong>Choose Font</strong></label>
						<Select
							className="" name="font"
							id="font" onChange={ e => this.handleChange( { target: { name: 'font', value: e.value } } ) }
							isSearchable={ false }
							styles={ fontsStyles }
							options={ this.state.fonts }
						/>
					</div>
					{ Object.keys( this.state.fields_data ).map( k => {
						const { settings, fields_data } = this.state;
						const key_slug = fields_data[k].slug;
						const settings_exists = Object.keys( settings ).indexOf( key_slug ) > -1;

						if ( ! settings_exists ) return <></>;

						let val = this.state.fields_data[ k ],
							options = [ { value: '', label: 'Select' + val.name + '...' } ];

						Object.keys( val.values ).forEach( key => {
							options = [ ...options, { value: key, label: val.values[key] } ];
						} );

						return <div className="xm-input-wrap" key={ val.slug }>
							<label htmlFor={ val.slug } className="text-right"><strong>{ val.name }</strong></label>
							<Select
								id={ val.slug }
								name={ val.slug }
								className="xm-letterify-input"
								isSearchable={ false }
								options={ options || [] }
								onChange={ e => this.handleChange( { target: { name: val.slug, value: e.value } } ) }
								// styles={ val.type && val.type === 'color' ? colourStyles : '' }
							/>
						</div>;
					} ) }
					<div className="xm-input-wrap">
						<label htmlFor="color" className="text-right"><strong>Color</strong></label>
						<Select
							className="" name="color" id="color"
							onChange={ e => this.handleChange( { target: { name: 'color', value: e.value } } ) }
							isSearchable={ false }
							styles={ colourStyles }
							options={ this.state.colors }
						/>
					</div>
					{ /* <div className="xm-input-wrap">
						<label htmlFor="finish" className="text-right"><strong>Finish</strong></label>
						<select name="finish" id="finish" onChange={ this.handleChange } value={ state.finish }>
							<option value="">Choose Finish...</option>
							<option value="painted">Painted</option>
							<option value="unpainted">Unpainted</option>
						</select>
					</div>
					<div className="xm-input-wrap">
						<label htmlFor="height" className="text-right"><strong>Height</strong></label>
						<select name="height" id="height" onChange={ this.handleChange } value={ state.height }>
							<option value="">Choose Height...</option>
							<option value="1">1 inch</option>
							<option value="2">2 inch</option>
							<option value="3">3 inch</option>
							<option value="4">4 inch</option>
							<option value="5">5 inch</option>
							<option value="6">6 inch</option>
							<option value="7">7 inch</option>
							<option value="8">8 inch</option>
							<option value="9">9 inch</option>
							<option value="10">10 inch</option>
							<option value="11">11 inch</option>
							<option value="12">12 inch</option>
							<option value="13">13 inch</option>
							<option value="14">14 inch</option>
							<option value="15">15 inch</option>
							<option value="16">16 inch</option>
							<option value="17">17 inch</option>
							<option value="18">18 inch</option>
						</select>
					</div>

					<div className="xm-input-wrap">
						<label htmlFor="thickness" className="text-right"><strong>Thickness</strong></label>
						<select name="thickness" id="thickness" onChange={ this.handleChange }>
							<option value="">Choose Thickness...</option>
							<option value="1/8 inch">1/8 inch</option>
							<option value="1/4 inch">1/4 inch</option>
							<option value="3/8 inch">3/8 inch</option>
							<option value="1/2 inch">1/2 inch</option>
							<option value="3/4 inch">3/4 inch</option>
						</select>
					</div>

					<div className="xm-input-wrap">
						<label htmlFor="mounting" className="text-right"><strong>Mounting</strong></label>
						<select name="mounting" id="mounting" onChange={ this.handleChange }>
							<option value="">- Select an Option -</option>
							<option value="">Hanging Strips & Paper Template (+10%)</option>
							<option value="">None</option>
						</select>
					</div>
					<div className="xm-input-wrap text-center xm-input-sm">
						<p>
							<strong>Approx. Width: </strong>
							{
								state.value !== '' && state.height !== ''
									? state.width.toFixed( 2 ) + '"'
									: 'Enter text and select a Height to see Approx. Width.'
							}
						</p>
					</div>
					<div className="xm-input-wrap xm-input-sm">
						<p>
							<strong>Total Letter Count: </strong>
							{ state.value.replace( /\s/g, '' ).length }
						</p>
					</div>
					<div className="xm-input-wrap xm-input-full">
						<label htmlFor="connect" className="text-right"><strong>Letter Connect</strong></label>
						<select name="connect" id="connect" onChange={ this.handleChange } value={ state.connect }>
							<option value="">-- Please Select --</option>
							<option value="shown" price="0">As Shown </option>
							<option value="connect" price="0">Each Word Connected </option>
							<option value="individual" price="0">Individual Letters </option>
						</select>
					</div>*/ }
					<div className="xm-input-wrap">
						<div className="xm-input-frag">
							Starting At: ${
								( base_price *
									this.state.form_data.value.replace( /\s/g, '' ).length *
									( state.quantity > 0 ? state.quantity : 1 )
								).toFixed( 2 )
							}
						</div>
						<div className="xm-input-frag">
							<label htmlFor="quantity" className="text-right"><strong>Qty</strong></label>
							<input type='number'
								name='quantity' value={ state.quantity }
								onChange={ this.handleChange } placeholder={ 'Enter your size' } />
						</div>
						<div className="xm-input-frag">
							<input
								type='submit' name='submit'
								className='xm-input-submit'
								disabled={ state.loading }
								value={ this.state.add_to_cart_text }
								onClick={ this.handleSubmit } />
						</div>
					</div>
				</form>
			</>
		);
	}
}

/**
 * Init Function
 *
 * @param $scope
 */
let init = function( $scope ) {
	const [ el ] = $scope.find( '.xm-letterify-form-wrapper' );
	if ( ! el ) {
		return;
	}
	const { price, wpNonce, fonts, colors, settings } = el.dataset;

	const [ templateEl ] = $scope.find( '.xm-letterify-template' );
	if ( ! templateEl ) {
		return;
	}

	/**
	 * Renders the main component
	 */
	ReactDOM.render(
		React.createElement( LetterifyEl, {
			templateEl: templateEl,
			base_price: price,
			wpNonce: wpNonce,
			fonts: fonts,
			colors: colors,
			settings: settings,
		} ),
		el,
	);
};

jQuery( window ).on( 'elementor/frontend/init', () => {

} ).on( 'load', function() {
	const shortcodeEls = document.querySelectorAll( '.xm-letterify' );

	shortcodeEls.forEach( ( el ) => {
		init( jQuery( el ) );
	} );
} );
