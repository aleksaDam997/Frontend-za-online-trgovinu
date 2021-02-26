import React from 'react';
import {Container, Card, Row, Col, CardImg, Form, Button} from 'react-bootstrap';
import {faArchway, faListAlt, faSearch} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import CategoryType from '../Types/CategoryType';
import api, { ApiResponse } from '../api/api';
import ArticleType from '../Types/ArticleType';
import { Link, Redirect } from 'react-router-dom';
import { ApiConfig } from '../config/ApiConfig';

interface CategoryPageProperties{
    match: {
        params: {
            id: number;
        }
    }
}

interface CategoryPageState{
    category?: CategoryType;
    articles?: ArticleType[];
    message?: string;
    subcategories?: CategoryType[];
    isLoggedIn: boolean;
    filters: {
        keywords: string;
        priceMin: number;
        priceMax: number;
        order: "name asc" | "name desc" | "price asc" | "price desc";
    }
}

interface CategoryDto{
    categoryId: number;
    name: string;
}

interface ArticleDto{
    articleId: number;
    name: string;
    excerpt: string;
    description: string;
    articlePrices:{
        price?: number,
        createdAt?: string
    }[],
    photos: {
        imagePath: string
    }[]
}

export default class CategoryPage extends React.Component<CategoryPageProperties>{

    state: CategoryPageState;

    constructor(props: Readonly<CategoryPageProperties>){
        super(props);

        this.state = {
            isLoggedIn: false,
            filters: {
                keywords: "",
                priceMin: 0.01,
                priceMax: 100000,
                order: "price asc"
            }
        };
    }

    private setLogginState(isLoggedIn: boolean){
        const newState = Object.assign(this.state,
            { isLoggedIn: isLoggedIn });

            this.setState(newState);
    }

    private printOptionalMessage(){
        if(this.state.message !== ''){
            return(
                <Card.Text>{this.state.message}</Card.Text>
            );
        }
    }

    private setSubcategories(subcategories: CategoryType[]){

        const newState = Object.assign(this.state, {
            subcategories: subcategories
        })

        this.setState(newState);
    }

    private setArticles(articles: ArticleType[]){

        const newState = Object.assign(this.state, {
            articles: articles
        })

        this.setState(newState);
    }

    private setMessage(message: string){

        const newState = Object.assign(this.state, {
            message: message
        })

        this.setState(newState);
    }

    private setCategoryData(categoryData: CategoryType){

        const newState = Object.assign(this.state, {
            category: categoryData
        })

        this.setState(newState);
    }

    render(){

        if(!this.state.isLoggedIn){
            <Redirect to="/login"></Redirect>
        }

        return(
            <Container>
                <Card bg="dark" text="primary">
                    <Card.Header><FontAwesomeIcon icon={faArchway}></FontAwesomeIcon> Categories </Card.Header>
                    <Card.Body>
                        <Card.Title>
                        <FontAwesomeIcon icon={faListAlt}></FontAwesomeIcon>
                             {this.state.category?.name}
                        </Card.Title>
                        <Container>
                            {this.printOptionalMessage()}
                            {this.showSubcategories()}
                            <Row>
                                <Col xs="12" md="4" lg="3">
                                    {this.printFilters()}
                                </Col>
                                <Col xs="12" md="8" lg="9">
                                    {this.showArticles()}
                                </Col>
                            </Row>
                        </Container>
                    </Card.Body>
                </Card>
            </Container>
        );
    }

    private printFilters(){
        return(
            <>
            <Form.Group>
                <Form.Label htmlFor="keywords">Search keywords: </Form.Label>
                <Form.Control type="text" id="keywords" value={this.state.filters.keywords} onChange={(e) =>
                     {this.filtersKeywordChange(e as any)}}></Form.Control>
            </Form.Group>
            <Form.Group>
                <Row>
                    <Col xs="12" sm="6">
                    <Form.Label htmlFor="priceMin">Min. price: </Form.Label>
                    <Form.Control type="number" id="priceMin" value={this.state.filters.priceMin} onChange={(e) => {this.filtersMinPriceChanged(e as any)}} 
                    min="0.01" max="99999.99" step="0.01"></Form.Control>
                    </Col>
                    <Col xs="12" sm="6">
                    <Form.Label htmlFor="priceMax">Max. price: : </Form.Label>
                    <Form.Control type="number" id="priceMax" value={this.state.filters.priceMax} onChange={(e) => {this.filtersMaxPriceChanged(e as any)}} 
                    min="0.01" max="99999.99" step="0.01"></Form.Control>
                    </Col>
                </Row>
            </Form.Group>
            <Form.Group>
                <Form.Control as="select" id="sortOrder" value={this.state.filters.order} onChange={ (e) => this.filterOrderChanged(e as any)}>
                    <option value="name asc">Sort by name - asc</option>
                    <option value="name desc">Sort by name - desc</option>
                    <option value="price asc">Sort by price - asc</option>
                    <option value="price desc">Sort by price - desc</option>
                </Form.Control>
            </Form.Group>
            <Form.Group>
                <Button variant="primary" block onClick={(e) => this.applyFilters()}><FontAwesomeIcon icon={faSearch}></FontAwesomeIcon>Search</Button>
            </Form.Group>
            </>

        );
    }

    private setNewFilter(newFilter: any){
        this.setState(Object.assign(this.state, {
            filter: newFilter
        })
        )
    }

    private applyFilters(){
        this.getCatData();
    }

    private filtersMinPriceChanged(event: React.ChangeEvent<HTMLInputElement>){
        this.setNewFilter(Object.assign(this.state.filters, { priceMin: Number(event.target.value) }));
    }

    private filtersMaxPriceChanged(event: React.ChangeEvent<HTMLInputElement>){
        this.setNewFilter(Object.assign(this.state.filters, { priceMax: Number(event.target.value) }));
    }

    private filtersKeywordChange(event: React.ChangeEvent<HTMLInputElement>){
        this.setNewFilter(Object.assign(this.state.filters, { keywords: event.target.value }));
    }

    private filterOrderChanged(event: React.ChangeEvent<HTMLSelectElement>){
        this.setNewFilter(Object.assign(this.state.filters, { order: event.target.value }));
    }

    componentWillMount(){
        this.getCatData();
    }

    componentWillReceiveProps(newProps: CategoryPageProperties){
        if(newProps.match.params.id === this.props.match.params.id){
            return;
        }
        this.getCatData();
    }

    private getCatData(){
       
        api('api/category/' + this.props.match.params.id, 'get', {}).then((res: ApiResponse) =>{

            if(res.status === 'login' || res.status === 'error'){ return this.setLogginState(false); }
            
            const categoryData: CategoryDto = {
                categoryId: res.data.categoryId,
                name: res.data.name
            }
        
            this.setCategoryData(categoryData);

            const subcategories: CategoryType[] = [];

            if(res.data.categories.length > 0){

                for(let category of res.data.categories){
                    subcategories.push({
                        categoryId: category.categoryId,
                        name: category.name
                    })
                }

                this.setSubcategories(subcategories);
            }    
        });     

        const orderParts = this.state.filters.order.split(' ');
        const orderBy = orderParts[0];
        const orderDirection = orderParts[1].toUpperCase();

        api('/api/article/search', 'post', {
            categoryId: this.props.match.params.id,
            keywords: this.state.filters.keywords,
            priceMin: this.state.filters.priceMin,
            priceMax: this.state.filters.priceMax,
            features: [],
            orederBy: orderBy,
            orderDirection: orderDirection
        }).then((res: ApiResponse) =>{

            if(res.status === 'login' || res.status === 'error'){ return this.setLogginState(false); }

            if(res.data.statusCode === 0){
                return this.setMessage('No articles found');
            }

            const articles: ArticleType[] = res.data.map((article: ArticleDto) => {

                const object: ArticleType = {
                    articleId: article.articleId,
                    name: article.name,
                    excerpt: article.excerpt,
                    description: article.description,
                    imageUrl: '',
                    price: 0
                }

                if(article.photos !== undefined && article.photos?.length > 0){
                    object.imageUrl = article.photos[article.photos.length -1].imagePath;
                }

                if(article.articlePrices !== undefined && article.articlePrices?.length > 0){
                    object.price = article.articlePrices[article.articlePrices.length -1].price;
                }

                return object;
            });

            this.setArticles(articles);
        });
    }

    componentDidMount(){
        this.getCatData();
    }

    private showSubcategories(){
        if(this.state.subcategories?.length === 0){
            return;
        }

        return(
            <Row>
                {this.state.subcategories?.map(this.singleCategorie)}
            </Row>
        );
    }

    private showArticles(){
        if(this.state.articles?.length === 0){
            return(
                <div>Nemamo artikala za ponuditi za ovu kategoriju!</div>
            );
        }

        return (
            <Row>
                {this.state.articles?.map(this.singleArticle)}
            </Row>
        );
    }

    private singleCategorie(subCategory: CategoryType){

        return(
            <Col lg="3" md="4" sm="6" xs="12">
              <Card>
                <Card.Body>
                  <Card.Title>
                    {subCategory.name}
                  </Card.Title>
                  <Link to={`/category/${subCategory.categoryId}`} className="btn btn-primary btn-block btn-sm"> Open category </Link>
                </Card.Body>
              </Card>
            </Col>);
    }

    private singleArticle(article: ArticleType){
        return(
            <Col lg="4" md="6" sm="6" xs="12">
                <Card className="mb-3">
                    <Card.Header>
                        {/* <img alt={article.name} src={ApiConfig.PHOTO_PATH + "small/" + article.imageUrl}></img> */}
                        <CardImg width="100%" src={ApiConfig.PHOTO_PATH + "small/" + article.imageUrl} alt={article.name} />
                    </Card.Header>
                    <Card.Body>
                        <Card.Title as="p">{article.name}</Card.Title>
                        <Card.Text>{article.excerpt}</Card.Text>
                        <Card.Text>Price: {article.price} EUR</Card.Text>
                        <Card.Text>{article.description}</Card.Text>
                        <Link to={`/article/${article.articleId}`} className="btn btn-primary btn-block  btn-sm">Open article page...</Link>
                    </Card.Body>
                </Card>
            </Col>
        );
    }

    componentDidUpdate(oldProperties: CategoryPageProperties) {
        if (oldProperties.match.params.id === this.props.match.params.id) {
            return;
        }

        this.getCatData();
    }
}